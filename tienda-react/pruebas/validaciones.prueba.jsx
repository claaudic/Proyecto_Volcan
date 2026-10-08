import { validarCorreo, validarDireccion, validarTelefonoObligatorio } from "../src/utilidades/validaciones";

describe("validarCorreo", () => {

    it("rechaza un correo vacío", () => {
        expect(validarCorreo("")).toBe("Ingresa tu correo electrónico.");
    });

    it("rechaza un dominio que no está permitido", () => {
        expect(validarCorreo("hola@yahoo.com")).not.toBe("");
    });

    it("acepta un correo de gmail", () => {
        expect(validarCorreo("camila@gmail.com")).toBe("");
    });

});

describe("validarDireccion", () => {

    it("acepta una calle con número", () => {
        expect(validarDireccion("Libertad 123")).toBe("");
        expect(validarDireccion("Av. O'Higgins 850, depto 12")).toBe("");
    });

    it("rechaza texto sin número o un número sin calle", () => {
        expect(validarDireccion("dvssdwa")).toContain("calle y el número");
        expect(validarDireccion("12345")).toContain("calle y el número");
    });

    it("es obligatoria", () => {
        expect(validarDireccion("   ")).toBe("Ingresa tu dirección de despacho.");
    });

});

describe("validarTelefonoObligatorio", () => {

    it("pide el teléfono y revisa su formato", () => {
        expect(validarTelefonoObligatorio("")).toBe("Ingresa un teléfono de contacto.");
        expect(validarTelefonoObligatorio("llámame")).not.toBe("");
        expect(validarTelefonoObligatorio("+56 9 1234 5678")).toBe("");
    });

});
