import { validarCorreo } from "../src/utilidades/validaciones";

describe("validarCorreo", () => {

    it("rechaza un correo vacío", () => {
        expect(validarCorreo("")).toBe("Ingresa tu correo electrónico.");
    });

    it("rechaza un dominio que no está permitido", () => {
        expect(validarCorreo("hola@yahoo.com")).not.toBe("");
    });

    it("acepta un correo de gmail", () => {
        expect(validarCorreo("cliente@gmail.com")).toBe("");
    });

});
