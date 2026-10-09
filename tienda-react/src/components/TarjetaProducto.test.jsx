import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import TarjetaProducto from "./TarjetaProducto";
import { montarConRouter, clic } from "../test/ayuda";

// Pruebas de PROPIEDADES: la tarjeta debe mostrar los datos que recibe.

describe("TarjetaProducto", () => {

    let pantalla;

    // Antes de cada prueba se monta una tarjeta nueva con estos datos
    beforeEach(() => {
        // La tarjeta tiene enlaces <Link>, por eso va dentro de un router
        pantalla = montarConRouter(
            <TarjetaProducto
                nombre="Cilindro GLP 15 kg"
                categoria="Cilindros de Gas"
                precio="$16.000"
                imagen="/img/cl003.jpg"
            />
        );
    });

    // Y despues de cada prueba se retira, para que no queden restos
    afterEach(() => {
        pantalla.desmontar();
    });

    it("muestra el nombre que recibe por props", () => {
        expect(pantalla.textContent).toContain("Cilindro GLP 15 kg");
    });

    it("muestra el precio que recibe por props", () => {
        expect(pantalla.querySelector(".precio").textContent).toBe("$16.000");
    });

});

// Prueba con un MOCK de funcion: en vez de pasarle el carrito real,
// le pasamos un espia que solo registra si lo llamaron.

describe("TarjetaProducto con el botón Añadir", () => {

    it("llama a la función que recibe al hacer clic en Añadir", () => {
        const alAnadir = vi.fn().mockReturnValue({ ok: true });

        const pantalla = montarConRouter(
            <TarjetaProducto
                codigo="CL003"
                nombre="Cilindro GLP 15 kg"
                categoria="Cilindros de Gas"
                precio="$16.000"
                imagen="/img/cl003.jpg"
                stock={90}
                alAnadir={alAnadir}
            />
        );

        const boton = pantalla.querySelector(".btn-anadir");
        clic(boton);

        expect(alAnadir).toHaveBeenCalledTimes(1);
        expect(boton.textContent).toBe("Agregado");

        pantalla.desmontar();
    });

});
