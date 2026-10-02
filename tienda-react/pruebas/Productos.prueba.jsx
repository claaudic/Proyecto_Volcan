import Productos from "../src/paginas/Productos";
import { montarEnTienda, escribir, clic } from "./ayuda";

// Pruebas de RENDERIZADO, ESTADO y EVENTOS sobre el catalogo.

describe("Productos", () => {

    let pantalla;

    beforeEach(() => {
        // El catalogo usa enlaces y el carrito: va con router y proveedor
        pantalla = montarEnTienda(<Productos />);
    });

    afterEach(() => {
        pantalla.desmontar();
    });

    // Cuenta cuantas tarjetas hay dibujadas en este momento
    function cantidadDeTarjetas() {
        return pantalla.querySelectorAll(".tarjeta-producto").length;
    }

    it("muestra los 14 productos del catálogo", () => {
        expect(cantidadDeTarjetas()).toBe(14);
    });

    it("filtra la lista al escribir en el buscador", () => {
        const buscador = pantalla.querySelector("input");

        escribir(buscador, "manguera");

        expect(cantidadDeTarjetas()).toBe(3);
    });

    it("filtra por categoría al hacer clic en su botón", () => {
        const botones = Array.from(pantalla.querySelectorAll("button"));
        const reguladores = botones.find((b) => b.textContent === "Reguladores");

        clic(reguladores);

        expect(cantidadDeTarjetas()).toBe(3);
    });

});
