import { describe, it, expect, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderizar, CLIENTE, pedidoDeEjemplo } from "../test/renderizar";
import { simularApi, simularApiApagada, CUENTAS } from "../test/api";
import { SIN_CONEXION } from "../utilidades/api";
import Perfil from "./Perfil";
import {
    actualizarCuenta,
    eliminarCuenta,
    buscarUsuario,
    buscarCuenta,
    registrarCliente,
    CLAVE_SESION
} from "../datos/usuarios";

// Pruebas del perfil: los datos se leen, guardan y eliminan en ms-usuarios
// (simulado con un fetch falso), y cada cliente ve solo sus propios pedidos.
// El primer grupo prueba las funciones locales que aun usa Admin Usuarios.

function limpiar() {
    localStorage.removeItem("usuariosSistema");
    localStorage.removeItem("cuentasEliminadas");
    localStorage.removeItem(CLAVE_SESION);
    localStorage.removeItem("pedidos_volcan");
}

describe("Perfil: datos de la cuenta", () => {

    afterEach(limpiar);

    it("actualiza una cuenta base sin cambiar su correo ni su rol", () => {
        actualizarCuenta("camila@gmail.com", {
            nombre: "Camila Rojas Díaz",
            telefono: "+56 9 1234 5678",
            correo: "otro@gmail.com",
            rol: "ADMINISTRADOR"
        });

        const cuenta = buscarUsuario("camila@gmail.com");
        expect(cuenta.nombre).toBe("Camila Rojas Díaz");
        expect(cuenta.telefono).toBe("+56 9 1234 5678");
        expect(cuenta.rol).toBe("CLIENTE");
        expect(buscarUsuario("otro@gmail.com")).toBeNull();

        // La contrasena original sigue sirviendo para entrar
        expect(buscarCuenta("camila@gmail.com", "Clien1234")).not.toBeNull();
    });

    it("una cuenta eliminada ya no puede iniciar sesión", () => {
        eliminarCuenta("camila@gmail.com");

        expect(buscarCuenta("camila@gmail.com", "Clien1234")).toBeNull();
    });

    it("un correo eliminado se puede volver a registrar", () => {
        eliminarCuenta("camila@gmail.com");

        registrarCliente({
            nombre: "Camila",
            apellidos: "Rojas",
            correo: "camila@gmail.com",
            contrasena: "Nueva123"
        });

        expect(buscarCuenta("camila@gmail.com", "Nueva123")).not.toBeNull();
    });

});

describe("Perfil: página conectada a ms-usuarios", () => {

    // Camila ya guardo su telefono y su direccion en la base
    const CAMILA_EN_BASE = { ...CUENTAS.camila, telefono: "+56 9 1234 5678", comuna: "Chillán", direccion: "Libertad 123" };

    function abrirPerfil() {
        renderizar(<Perfil />, { usuario: CLIENTE });
    }

    it("carga los datos de la cuenta con GET /usuarios/yo y el token", async () => {
        const api = simularApi({ "GET /usuarios/yo": () => [200, CAMILA_EN_BASE] });
        abrirPerfil();

        expect(screen.getByText("Cargando tus datos…")).toBeInTheDocument();
        expect(await screen.findByDisplayValue("Libertad 123")).toBeInTheDocument();
        expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Camila");
        expect(screen.getByLabelText(/^Apellidos/)).toHaveValue("Rojas");
        expect(api.mock.calls[0][1].headers.Authorization).toMatch(/^Bearer /);
    });

    it("si el backend no responde, lo avisa", async () => {
        simularApiApagada();
        abrirPerfil();

        expect(await screen.findByRole("alert")).toHaveTextContent(SIN_CONEXION);
    });

    it("guarda con PUT /usuarios/yo y actualiza el nombre de la sesión", async () => {
        let enviado;
        simularApi({
            "GET /usuarios/yo": () => [200, CAMILA_EN_BASE],
            "PUT /usuarios/yo": (cuerpo) => {
                enviado = cuerpo;
                return [200, { ...CAMILA_EN_BASE, ...cuerpo }];
            }
        });
        const user = userEvent.setup();
        abrirPerfil();

        const apellidos = await screen.findByLabelText(/^Apellidos/);
        await user.clear(apellidos);
        await user.type(apellidos, "Rojas Díaz");
        await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

        expect(await screen.findByText("Tus datos quedaron guardados.")).toBeInTheDocument();
        expect(enviado).toEqual({
            nombre: "Camila", apellidos: "Rojas Díaz", telefono: "+56 9 1234 5678",
            comuna: "Chillán", direccion: "Libertad 123"
        });
        expect(JSON.parse(localStorage.getItem(CLAVE_SESION)).usuario.nombre).toBe("Camila Rojas Díaz");
    });

    it("muestra el mensaje del backend si rechaza los datos", async () => {
        simularApi({
            "GET /usuarios/yo": () => [200, CAMILA_EN_BASE],
            "PUT /usuarios/yo": () => [400, { estado: 400, mensaje: "El teléfono solo admite números, espacios y el signo +." }]
        });
        const user = userEvent.setup();
        abrirPerfil();

        await user.click(await screen.findByRole("button", { name: "Guardar cambios" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("El teléfono solo admite números, espacios y el signo +.");
    });

    it("no llama al backend si falta la dirección de despacho", async () => {
        const api = simularApi({ "GET /usuarios/yo": () => [200, CUENTAS.camila] });
        const user = userEvent.setup();
        abrirPerfil();

        await user.click(await screen.findByRole("button", { name: "Guardar cambios" }));

        expect(screen.getByText("Ingresa tu dirección de despacho.")).toBeInTheDocument();
        expect(api).toHaveBeenCalledTimes(1);
    });

    it("elimina la cuenta con DELETE /usuarios/yo y cierra la sesión", async () => {
        const api = simularApi({
            "GET /usuarios/yo": () => [200, CAMILA_EN_BASE],
            "DELETE /usuarios/yo": () => [204]
        });
        const user = userEvent.setup();
        abrirPerfil();

        await user.click(await screen.findByRole("button", { name: "Eliminar mi cuenta" }));
        await user.click(screen.getByRole("button", { name: "Sí, eliminar mi cuenta" }));

        expect(await screen.findByText("Página de login")).toBeInTheDocument();
        expect(api).toHaveBeenCalledWith(expect.stringContaining("/usuarios/yo"), expect.objectContaining({ method: "DELETE" }));
        expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    });

    it("muestra solo los pedidos del cliente con sesión iniciada", async () => {
        simularApi({ "GET /usuarios/yo": () => [200, CAMILA_EN_BASE] });
        localStorage.setItem("pedidos_volcan", JSON.stringify([
            pedidoDeEjemplo({ numero: 1 }),
            pedidoDeEjemplo({ numero: 2, cliente: { nombre: "Otra persona", correo: "otra@gmail.com" } })
        ]));
        abrirPerfil();

        expect(await screen.findByText("Pedido N° 1")).toBeInTheDocument();
        expect(screen.queryByText("Pedido N° 2")).toBeNull();
    });

});
