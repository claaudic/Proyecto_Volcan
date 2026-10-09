import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Checkout from "./Checkout";
import { MemoryRouter } from "react-router-dom";
import { montarEnTienda, montar, clic } from "../test/ayuda";
import ProveedorSesion from "../contexto/ProveedorSesion";
import ProveedorCatalogo from "../contexto/ProveedorCatalogo";
import ProveedorCarrito from "../contexto/ProveedorCarrito";

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
        localStorage.removeItem("usuarioActivo");
        localStorage.removeItem("usuariosSistema");
    });

    it("rellena los datos con los de la cuenta", () => {
        // Camila guardo su direccion y comuna en el perfil
        localStorage.setItem("usuariosSistema", JSON.stringify([{
            nombre: "Camila Rojas", correo: "camila@gmail.com", contrasena: "Clien1234",
            rol: "CLIENTE", direccion: "Libertad 123", comuna: "chillan viejo"
        }]));
        localStorage.setItem("usuarioActivo", JSON.stringify({
            nombre: "Camila Rojas", correo: "camila@gmail.com", rol: "CLIENTE"
        }));

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

        expect(pantalla.querySelector("#nombre").value).toBe("Camila Rojas");
        expect(pantalla.querySelector("#direccion").value).toBe("Libertad 123");
        // Escrita sin tilde en la cuenta, igual se reconoce
        expect(pantalla.querySelector("#comuna").value).toBe("Chillán Viejo");
    });

});
