import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Checkout from "./Checkout";
import { MemoryRouter } from "react-router-dom";
import { montarEnTienda, montar, clic } from "../test/ayuda";
import { waitFor } from "@testing-library/react";
import { guardarSesionDePrueba, simularApi, simularApiApagada, CUENTAS } from "../test/api";
import ProveedorSesion from "../contexto/ProveedorSesion";
import ProveedorCatalogo from "../contexto/ProveedorCatalogo";
import ProveedorCarrito from "../contexto/ProveedorCarrito";

describe("Checkout", () => {

    let pantalla;

    beforeEach(async () => {
        sessionStorage.clear();
        const categoria = { id: 91, nombre: 'Categoría de prueba' };
        simularApi({
            'GET /productos': () => [200, [{ id: 901, codigo: 'CL002', nombre: 'Producto de prueba',
                precioResidencial: 220, precioComercial: 200, precioOferta: null,
                activo: true, stock: 3, unidad: 'Unidad', categoria }]],
            'GET /categorias': () => [200, [categoria]]
        });
        pantalla = montarEnTienda(
            <Checkout />,
            [
                {
                    codigo: "CL002",
                    cantidad: 1
                }
            ]
        );
        await waitFor(() => expect(pantalla.textContent).toContain('Producto de prueba'));
    });

    afterEach(() => {
        pantalla.desmontar();
    });

    function erroresVisibles() {
        return Array.from(
            pantalla.querySelectorAll(".mensaje-error-campo")
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
describe("Checkout con sesión iniciada", () => {

    let pantalla;

    afterEach(() => {
        pantalla.desmontar();
    });

    function abrirCheckout() {
        guardarSesionDePrueba({ nombre: "Camila Rojas", correo: "camila@gmail.com", rol: "CLIENTE" });

        pantalla = montar(
            <MemoryRouter>
                <ProveedorSesion>
                    <ProveedorCatalogo>
                        <ProveedorCarrito>
                            <Checkout />
                        </ProveedorCarrito>
                    </ProveedorCatalogo>
                </ProveedorSesion>
            </MemoryRouter>
        );
    }

    it("rellena los datos con los de la cuenta (GET /usuarios/yo)", async () => {
        // Camila guardo su direccion y comuna en el perfil (la comuna sin tilde)
        simularApi({
            "GET /usuarios/yo": () => [200, { ...CUENTAS.camila, telefono: "+56 9 1234 5678", direccion: "Libertad 123", comuna: "chillan viejo" }]
        });
        abrirCheckout();

        // El nombre y el correo salen de la sesion, sin esperar al backend
        expect(pantalla.querySelector("#nombre").value).toBe("Camila Rojas");
        expect(pantalla.querySelector("#correo").value).toBe("camila@gmail.com");

        await waitFor(() => expect(pantalla.querySelector("#direccion").value).toBe("Libertad 123"));
        expect(pantalla.querySelector("#telefono").value).toBe("+56 9 1234 5678");
        // Escrita sin tilde en la cuenta, igual se reconoce
        expect(pantalla.querySelector("#comuna").value).toBe("Chillán Viejo");
    });

    it("si el backend no responde, el cliente igual puede escribir sus datos", async () => {
        const api = simularApiApagada();
        abrirCheckout();

        await waitFor(() => expect(api).toHaveBeenCalled());
        expect(pantalla.querySelector("#nombre").value).toBe("Camila Rojas");
        expect(pantalla.querySelector("#direccion").value).toBe("");
    });

});
