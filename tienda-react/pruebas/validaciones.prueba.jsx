    import {
        validarCorreo,
        validarDireccion,
        validarTelefonoObligatorio,
        runValido
    } from "../src/utilidades/validaciones";

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
    describe("runValido", () => {

        it("acepta un RUN válido", () => {
            expect(runValido("190110222")).toBeTrue();
        });

        it("rechaza un RUN con dígito verificador incorrecto", () => {
            expect(runValido("190110221")).toBeFalse();
        });

        it("acepta K como dígito verificador", () => {
            expect(runValido("1000005K")).toBeTrue();
        });

        it("rechaza RUN con puntos o guion", () => {
            expect(runValido("19.011.022-2")).toBeFalse();
        });

    });