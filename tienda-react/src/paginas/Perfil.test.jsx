import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderizar, CLIENTE } from "../test/renderizar";
import { simularApi, simularApiApagada, CUENTAS } from "../test/api";
import { SIN_CONEXION } from "../utilidades/api";
import Perfil from "./Perfil";
import RutaProtegida from "../components/RutaProtegida";
import { CLAVE_SESION } from "../datos/usuarios";

// Pruebas del perfil: los datos se leen, guardan y eliminan en ms-usuarios
// (simulado con un fetch falso), y cada cliente ve solo sus propios pedidos.

describe("Perfil: página conectada a ms-usuarios", () => {

    // Camila ya guardo su telefono y su direccion en la base
    const CAMILA_EN_BASE = { ...CUENTAS.camila, telefono: "+56 9 1234 5678", comuna: "Chillán", direccion: "Libertad 123" };

    // Como en App.jsx: el perfil va dentro de RutaProtegida (sin sesion → login)
    function abrirPerfil() {
        renderizar(<RutaProtegida><Perfil /></RutaProtegida>, { usuario: CLIENTE });
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
            "GET /boletas": () => [200, []],
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
        expect(api.mock.calls.some(([, opciones]) => opciones.method === "PUT")).toBe(false);
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

    it("muestra los pedidos reales del cliente (GET /boletas) con el nombre de cada producto", async () => {
        const api = simularApi({
            "GET /usuarios/yo": () => [200, CAMILA_EN_BASE],
            // ms-pedidos ya devuelve solo las boletas de esta cuenta
            "GET /boletas": () => [200, [
                { id: 7, clienteId: 5, direccion: "Libertad 123", comuna: "Chillán", estado: "EN_CAMINO",
                    repartidorId: 3, fecha: "2026-11-12T11:00:00", total: 13000,
                    detalles: [{ id: 70, productoId: 1, cantidad: 2, precio: 6500 }] },
                { id: 4, clienteId: 5, direccion: "Libertad 123", comuna: "Chillán", estado: "ENTREGADO",
                    repartidorId: 3, fecha: "2026-11-10T09:00:00", total: 14500,
                    detalles: [{ id: 40, productoId: 2, cantidad: 1, precio: 14500 }] }
            ]],
            "GET /productos": () => [200, [
                { id: 1, codigo: "CL001", nombre: "Cilindro GLP 5 kg" },
                { id: 2, codigo: "CL002", nombre: "Cilindro GLP 11 kg" }
            ]]
        });
        abrirPerfil();

        expect(await screen.findByText("Pedido N° 7")).toBeInTheDocument();
        expect(screen.getByText("Pedido N° 4")).toBeInTheDocument();
        expect(screen.getByText("En camino")).toBeInTheDocument();
        expect(await screen.findByText(/2 × Cilindro GLP 5 kg/)).toBeInTheDocument();
        expect(screen.getByText("Tienes 2 pedidos registrados.")).toBeInTheDocument();
        // El más reciente va primero
        const numeros = screen.getAllByText(/^Pedido N°/).map((n) => n.textContent);
        expect(numeros).toEqual(["Pedido N° 7", "Pedido N° 4"]);
        expect(api).toHaveBeenCalledWith(expect.stringContaining("/boletas"), expect.anything());
    });

    it("sin compras invita a ver el catálogo", async () => {
        simularApi({
            "GET /usuarios/yo": () => [200, CAMILA_EN_BASE],
            "GET /boletas": () => [200, []],
            "GET /productos": () => [200, []]
        });
        abrirPerfil();

        expect(await screen.findByText("Todavía no has hecho ningún pedido.")).toBeInTheDocument();
    });

});
