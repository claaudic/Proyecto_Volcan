import { describe, it, expect, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { montar, escribir } from "../test/ayuda";
import { act } from "react";
import ProveedorSesion from "../contexto/ProveedorSesion";
import Perfil from "./Perfil";
import {
    actualizarCuenta,
    eliminarCuenta,
    buscarUsuario,
    buscarCuenta,
    registrarCliente
} from "../datos/usuarios";

// Pruebas del perfil: editar y eliminar la cuenta,
// y que cada cliente vea solo sus propios pedidos.

function limpiar() {
    localStorage.removeItem("usuariosSistema");
    localStorage.removeItem("cuentasEliminadas");
    localStorage.removeItem("usuarioActivo");
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

describe("Perfil: página", () => {

    let contenedor;

    // Inicia sesion como Camila antes de montar la pagina
    function montarPerfil() {
        localStorage.setItem("usuarioActivo", JSON.stringify({
            nombre: "Camila Rojas", correo: "camila@gmail.com", rol: "CLIENTE"
        }));

        contenedor = montar(
            <MemoryRouter>
                <ProveedorSesion>
                    <Perfil />
                </ProveedorSesion>
            </MemoryRouter>
        );
    }

    afterEach(() => {
        contenedor.desmontar();
        limpiar();
    });

    it("muestra solo los pedidos del cliente con sesión iniciada", () => {
        localStorage.setItem("pedidos_volcan", JSON.stringify([
            {
                numero: 1, fecha: "2026-10-01T12:00:00.000Z", estado: "Pendiente",
                cliente: { nombre: "Camila Rojas", correo: "camila@gmail.com" },
                productos: [{ codigo: "CL001", nombre: "Cilindro 5 kg", cantidad: 1, subtotal: 10000 }],
                total: 10000
            },
            {
                numero: 2, fecha: "2026-10-02T12:00:00.000Z", estado: "Pendiente",
                cliente: { nombre: "Otra persona", correo: "otra@gmail.com" },
                productos: [{ codigo: "CL002", nombre: "Cilindro 11 kg", cantidad: 1, subtotal: 20000 }],
                total: 20000
            }
        ]));

        montarPerfil();

        const pedidos = contenedor.querySelectorAll(".lista-pedidos > li");
        expect(pedidos.length).toBe(1);
        expect(pedidos[0].textContent).toContain("Pedido N° 1");
    });

    it("guarda el nombre nuevo en la cuenta y en la sesión", () => {
        montarPerfil();

        escribir(contenedor.querySelector("#apellidos"), "Rojas Díaz");
        escribir(contenedor.querySelector("#direccion"), "Libertad 123");

        const formulario = contenedor.querySelector("#formPerfil");
        act(() => {
            formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });

        expect(contenedor.querySelector(".mensaje-exito").textContent).toBe("Tus datos quedaron guardados.");
        expect(buscarUsuario("camila@gmail.com").nombre).toBe("Camila Rojas Díaz");
        expect(JSON.parse(localStorage.getItem("usuarioActivo")).nombre).toBe("Camila Rojas Díaz");
    });

    it("no guarda si falta la dirección de despacho", () => {
        montarPerfil();

        const formulario = contenedor.querySelector("#formPerfil");
        act(() => {
            formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });

        expect(contenedor.querySelector(".mensaje-exito")).toBeNull();
        const errorDireccion = contenedor.querySelector("#direccion").nextElementSibling;
        expect(errorDireccion.textContent).toBe("Ingresa tu dirección de despacho.");
    });

});
