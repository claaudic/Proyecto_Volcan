import { describe, it, expect } from "vitest";
import {
    validarCorreoCliente,
    validarRepeticion,
    validarTelefono
} from "../utilidades/validaciones";
import { buscarZona } from "../datos/zonas";

// Pruebas del registro de clientes: sus reglas de validacion y el aviso de cobertura.
// El registro contra ms-usuarios se prueba en Tienda.test.jsx.

describe("Registro: validaciones", () => {

    it("no deja crear cuentas del equipo desde la tienda", () => {
        expect(validarCorreoCliente("nueva@gaselvolcan.cl")).toContain("administrador");
    });

    it("acepta un correo de cliente", () => {
        expect(validarCorreoCliente("camila@gmail.com")).toBe("");
    });

    it("avisa si las contraseñas no coinciden", () => {
        expect(validarRepeticion("Clave123", "Clave124")).toBe("Las contraseñas no coinciden.");
    });

    it("el teléfono es opcional, pero si se escribe debe ser válido", () => {
        expect(validarTelefono("")).toBe("");
        expect(validarTelefono("+56 9 1234 5678")).toBe("");
        expect(validarTelefono("llámame")).not.toBe("");
    });

});

describe("Registro: zonas de reparto", () => {

    it("reconoce la comuna aunque se escriba sin tilde", () => {
        expect(buscarZona("chillan").zona).toBe("Zona Centro");
        expect(buscarZona("Quillón").zona).toBe("Zona Sur");
    });

    it("devuelve null si no repartimos en esa comuna", () => {
        expect(buscarZona("Concepción")).toBeNull();
    });

});
