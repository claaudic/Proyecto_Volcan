import Checkout from "../src/paginas/Checkout";
import { montarEnTienda, clic } from "./ayuda";

describe("Checkout", () => {

    let pantalla;

    beforeEach(() => {
        pantalla = montarEnTienda(
            <Checkout />,
            [
                {
                    codigo: "CL002",
                    cantidad: 1
                }
            ]
        );
    });

    afterEach(() => {
        pantalla.desmontar();
    });

    function erroresVisibles() {
        return Array.from(
            pantalla.querySelectorAll(".invalid-feedback")
        )
            .map((mensaje) => mensaje.textContent)
            .filter((texto) => texto !== "");
    }

    it("muestra errores al enviar el formulario vacío", () => {
        const enviar = pantalla.querySelector('button[type="submit"]');

        clic(enviar);

        expect(erroresVisibles().length).toBeGreaterThan(0);
    });

});