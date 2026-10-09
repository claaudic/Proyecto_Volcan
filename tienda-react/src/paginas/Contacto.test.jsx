import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderizar } from "../test/renderizar";
import Contacto from "./Contacto";
import { montarConRouter, clic } from "../test/ayuda";

// Pruebas de RENDERIZADO CONDICIONAL: los mensajes de error
// solo deben aparecer cuando de verdad hay un error.

describe("Contacto", () => {

    let pantalla;

    beforeEach(() => {
        // Contacto usa <Link>, por eso se monta dentro de un router
        pantalla = montarConRouter(<Contacto />);
    });

    afterEach(() => {
        pantalla.desmontar();
    });

    // Devuelve solo los mensajes de error que tienen texto
    function erroresVisibles() {
        return Array.from(pantalla.querySelectorAll(".mensaje-error-campo"))
            .map((mensaje) => mensaje.textContent)
            .filter((texto) => texto !== "");
    }

    it("no muestra errores al abrir la página", () => {
        expect(erroresVisibles().length).toBe(0);
    });

    it("muestra los tres errores al enviar el formulario vacío", () => {
        const enviar = pantalla.querySelector('button[type="submit"]');

        clic(enviar);

        expect(erroresVisibles().length).toBe(3);
    });

});

describe("Contacto: envío", () => {

    it("con datos válidos agradece por el nombre y limpia el formulario", async () => {
        const user = userEvent.setup();
        renderizar(<Contacto />);

        await user.type(screen.getByLabelText(/Nombre/), "Camila Rojas");
        await user.type(screen.getByLabelText(/Correo/), "camila@gmail.com");
        await user.type(screen.getByLabelText(/Mensaje|Comentario/), "Quiero saber si llegan a Pinto.");
        await user.click(screen.getByRole("button", { name: /Enviar/ }));

        expect(screen.getByText(/Gracias Camila, recibimos tu mensaje/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Nombre/)).toHaveValue("");
    });

});
