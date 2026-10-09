import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

describe("TarjetaProducto: avisos e imagen", () => {

    function montarTarjeta(alAnadir) {
        return render(
            <MemoryRouter>
                <TarjetaProducto codigo="CL001" nombre="Cilindro GLP 5 kg" categoria="Cilindros de Gas"
                    precio="$6.500" imagen="/img/cl001.jpg" stock={5} alAnadir={alAnadir} />
            </MemoryRouter>
        );
    }

    it("muestra Agregado y vuelve a Añadir después de un momento", async () => {
        vi.useFakeTimers();
        montarTarjeta(() => ({ ok: true }));

        fireEvent.click(screen.getByRole("button", { name: "Añadir" }));
        expect(screen.getByRole("button", { name: "Agregado" })).toBeInTheDocument();

        await act(async () => { vi.advanceTimersByTime(1400); });
        expect(screen.getByRole("button", { name: "Añadir" })).toBeInTheDocument();
        vi.useRealTimers();
    });

    it("muestra Sin stock si no se pudo agregar", () => {
        montarTarjeta(() => ({ ok: false }));

        fireEvent.click(screen.getByRole("button", { name: "Añadir" }));

        expect(screen.getByRole("button", { name: "Sin stock" })).toBeInTheDocument();
    });

    it("sin la función Añadir muestra solo Ver producto", () => {
        render(
            <MemoryRouter>
                <TarjetaProducto codigo="CL001" nombre="Cilindro GLP 5 kg" precio="$6.500" imagen="/img/cl001.jpg" />
            </MemoryRouter>
        );

        expect(screen.getByRole("link", { name: "Ver producto" })).toBeInTheDocument();
    });

    it("si la imagen no carga, muestra el logo", () => {
        montarTarjeta(() => ({ ok: true }));
        const imagen = screen.getByRole("img", { name: "Cilindro GLP 5 kg" });

        fireEvent.error(imagen);
        fireEvent.error(imagen);

        expect(imagen.getAttribute("src")).toBe("/img/logo.svg");
    });

});
