import { act } from "react";
import Nosotros from "../src/paginas/Nosotros";
import { montarConRouter, escribir } from "./ayuda";

// Pruebas del buscador de cobertura de Nosotros:
// escribe una comuna, aprieta "Revisar" y revisa el resultado.

describe("Nosotros: buscador de cobertura", () => {

    let pantalla;

    beforeEach(() => {
        pantalla = montarConRouter(<Nosotros />);
    });

    afterEach(() => {
        pantalla.desmontar();
    });

    function buscar(comuna) {
        escribir(pantalla.querySelector("#comuna"), comuna);

        const formulario = pantalla.querySelector("#formCobertura");
        act(() => {
            formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
    }

    it("no muestra resultado antes de buscar", () => {
        expect(pantalla.querySelector(".resultado-cobertura")).toBeNull();
    });

    it("muestra la zona, los días y el horario si llegamos", () => {
        buscar("chillan viejo");

        const resultado = pantalla.querySelector(".resultado-si");
        expect(resultado.textContent).toContain("Sí, llegamos a Chillán Viejo");
        expect(resultado.textContent).toContain("Zona Oriente");
        expect(resultado.textContent).toContain("Lunes a viernes");
    });

    it("avisa si no llegamos a esa comuna", () => {
        buscar("Concepción");

        expect(pantalla.querySelector(".resultado-sin").textContent).toContain("Todavía no llegamos ahí");
    });

    it("esconde el resultado al borrar la comuna", () => {
        buscar("Bulnes");
        escribir(pantalla.querySelector("#comuna"), "");

        expect(pantalla.querySelector(".resultado-cobertura")).toBeNull();
    });

});
