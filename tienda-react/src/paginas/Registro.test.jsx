import { describe, it, expect, afterEach } from "vitest";
import {
    validarCorreoCliente,
    validarRepeticion,
    validarTelefono
} from "../utilidades/validaciones";
import { buscarZona } from "../datos/zonas";
import { registrarCliente, correoRegistrado, buscarCuenta } from "../datos/usuarios";

// Pruebas del registro de clientes: sus reglas de validacion,
// el aviso de cobertura y que la cuenta nueva quede guardada.

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

describe("Registro: cuenta nueva", () => {

    afterEach(() => {
        localStorage.removeItem("usuariosSistema");
    });

    it("guarda la cuenta como cliente y permite iniciar sesión con ella", () => {
        expect(correoRegistrado("nueva@gmail.com")).toBe(false);

        registrarCliente({
            nombre: "Ana",
            apellidos: "Soto",
            correo: "Nueva@Gmail.com",
            contrasena: "Ana1234"
        });

        expect(correoRegistrado("nueva@gmail.com")).toBe(true);

        const cuenta = buscarCuenta("nueva@gmail.com", "Ana1234");
        expect(cuenta.nombre).toBe("Ana Soto");
        expect(cuenta.rol).toBe("CLIENTE");
    });

});
