import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderizar } from "../test/renderizar";
import Productos from "./Productos";
import { montarEnTienda, escribir, clic } from "../test/ayuda";

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

        // Busca tambien en la descripcion y la categoria: aparecen
        // las 4 de "Mangueras y Conexiones", no solo las 3 que lo dicen en el nombre
        escribir(buscador, "manguera");

        expect(cantidadDeTarjetas()).toBe(4);
    });

    it("filtra por categoría al hacer clic en su botón", () => {
        const botones = Array.from(pantalla.querySelectorAll("button"));
        const reguladores = botones.find((b) => b.textContent === "Reguladores");

        clic(reguladores);

        expect(cantidadDeTarjetas()).toBe(3);
    });

    it("avisa si no hay resultados y permite volver a ver todo", () => {
        escribir(pantalla.querySelector("input"), "parrilla");

        expect(cantidadDeTarjetas()).toBe(0);
        expect(pantalla.querySelector(".sin-resultados").textContent).toContain("No encontramos productos");

        const verTodo = Array.from(pantalla.querySelectorAll("button"))
            .find((b) => b.textContent.includes("Ver todo el catálogo"));
        clic(verTodo);

        expect(cantidadDeTarjetas()).toBe(14);
    });

});

describe("Productos: añadir al carrito", () => {

    it("el botón Añadir de una tarjeta agrega una unidad", async () => {
        const user = userEvent.setup();
        renderizar(<Productos />);

        await user.click(screen.getAllByRole("button", { name: "Añadir" })[0]);

        expect(JSON.parse(localStorage.getItem("carritoVolcan"))).toEqual([{ codigo: "CL001", cantidad: 1 }]);
        expect(screen.getAllByRole("button", { name: "Agregado" })).toHaveLength(1);
    });

});
