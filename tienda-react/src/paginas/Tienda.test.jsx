import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import { montar, montarEnRuta, escribir } from "../test/ayuda";
import App from "../App";
import ProveedorSesion from "../contexto/ProveedorSesion";
import ProveedorCatalogo from "../contexto/ProveedorCatalogo";
import ProveedorCarrito from "../contexto/ProveedorCarrito";
import Inicio from "./Inicio";
import DetalleProducto from "./DetalleProducto";
import Registro from "./Registro";
import Login from "./Login";
import Navbar from "../components/Navbar";
import { CLAVE_SESION } from "../datos/usuarios";
import { simularApi, respuestaLogin } from "../test/api";

// Pruebas de las paginas de la tienda que no tenian pruebas:
// Inicio, Detalle del producto, Registro y la barra de navegacion.

describe("Inicio", () => {

    let pantalla;

    afterEach(() => {
        pantalla.desmontar();
    });

    it("muestra los 8 productos destacados", () => {
        pantalla = montarEnRuta("/", { "/": <Inicio /> });

        expect(pantalla.querySelectorAll(".tarjeta-producto").length).toBe(8);
    });

});

describe("Detalle del producto", () => {

    let pantalla;

    afterEach(() => {
        pantalla.desmontar();
    });

    it("muestra el producto del código que viene en la dirección", () => {
        pantalla = montarEnRuta("/producto/CL002", { "/producto/:codigo": <DetalleProducto /> });

        expect(pantalla.querySelector("#tituloProducto").textContent).toBe("Cilindro GLP 11 kg");
    });

    it("avisa si el código no existe", () => {
        pantalla = montarEnRuta("/producto/XX999", { "/producto/:codigo": <DetalleProducto /> });

        expect(pantalla.textContent).toContain("No encontramos ese producto");
    });

});

describe("Registro", () => {

    let pantalla;

    beforeEach(() => {
        pantalla = montarEnRuta("/registro", {
            "/registro": <Registro />,
            "/login": <Login />,
            "/": <p id="paginaInicio">Inicio</p>
        });
    });

    afterEach(() => {
        pantalla.desmontar();
    });

    function enviar() {
        const formulario = pantalla.querySelector("#formRegistro");
        act(() => {
            formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
    }

    it("marca los errores si se envía vacío", () => {
        enviar();

        const errores = Array.from(pantalla.querySelectorAll(".mensaje-error-campo"))
            .filter((mensaje) => mensaje.textContent !== "");

        expect(errores.length).toBeGreaterThan(0);
        expect(pantalla.querySelector("#paginaInicio")).toBeNull();
    });

    it("con datos válidos crea la cuenta en ms-usuarios y lleva al inicio", async () => {
        const ana = { id: 6, nombre: "Ana", apellidos: "Soto", correo: "ana.soto@gmail.com", rol: "CLIENTE", activo: true };
        const api = simularApi({
            "POST /auth/registro": () => [201, ana],
            "POST /auth/login": () => [200, respuestaLogin(ana)]
        });

        escribir(pantalla.querySelector("#nombre"), "Ana");
        escribir(pantalla.querySelector("#apellidos"), "Soto");
        escribir(pantalla.querySelector("#correo"), "ana.soto@gmail.com");
        escribir(pantalla.querySelector("#contrasena"), "Ana1234");
        escribir(pantalla.querySelector("#repetir"), "Ana1234");
        enviar();

        await vi.waitFor(() => expect(pantalla.querySelector("#paginaInicio")).not.toBeNull());
        // Se envio el registro y despues se inicio sesion con la cuenta nueva
        expect(JSON.parse(api.mock.calls[0][1].body).correo).toBe("ana.soto@gmail.com");
        expect(JSON.parse(localStorage.getItem(CLAVE_SESION)).usuario.nombre).toBe("Ana Soto");
    });

    it("si la cuenta se crea pero el login falla, lleva al login con un aviso y el correo escrito", async () => {
        const ana = { id: 6, nombre: "Ana", apellidos: "Soto", correo: "ana.soto@gmail.com", rol: "CLIENTE", activo: true };
        simularApi({
            "POST /auth/registro": () => [201, ana],
            "POST /auth/login": () => [500, { estado: 500, mensaje: "Ocurrió un error inesperado." }]
        });

        escribir(pantalla.querySelector("#nombre"), "Ana");
        escribir(pantalla.querySelector("#apellidos"), "Soto");
        escribir(pantalla.querySelector("#correo"), "ana.soto@gmail.com");
        escribir(pantalla.querySelector("#contrasena"), "Ana1234");
        escribir(pantalla.querySelector("#repetir"), "Ana1234");
        enviar();

        // No se queda en el registro (reintentar diría "ya existe ese correo")
        await vi.waitFor(() =>
            expect(pantalla.querySelector("[role=status].mensaje-exito").textContent)
                .toBe("Tu cuenta fue creada. Inicia sesión con tu correo y contraseña."));
        expect(pantalla.querySelector("#formRegistro")).toBeNull();
        expect(pantalla.querySelector("input[type=email]").value).toBe("ana.soto@gmail.com");
    });

    it("avisa si el correo ya tiene una cuenta", async () => {
        simularApi({
            "POST /auth/registro": () => [400, { estado: 400, mensaje: "Ya existe un usuario con ese correo." }]
        });

        escribir(pantalla.querySelector("#nombre"), "Camila");
        escribir(pantalla.querySelector("#apellidos"), "Rojas");
        escribir(pantalla.querySelector("#correo"), "camila@gmail.com");
        escribir(pantalla.querySelector("#contrasena"), "Clien1234");
        escribir(pantalla.querySelector("#repetir"), "Clien1234");
        enviar();

        await vi.waitFor(() =>
            expect(pantalla.querySelector("[role=alert]").textContent).toBe("Ya existe un usuario con ese correo."));
        expect(pantalla.querySelector("#paginaInicio")).toBeNull();
    });

});

describe("Barra de navegación", () => {

    let pantalla;

    afterEach(() => {
        pantalla.desmontar();
    });

    it("sin sesión muestra el botón Ingresar", () => {
        pantalla = montarEnRuta("/", { "/": <Navbar /> });

        expect(pantalla.textContent).toContain("Ingresar");
        expect(pantalla.querySelector(".avatar-cuenta")).toBeNull();
    });

    it("con sesión muestra las iniciales y lleva al perfil", () => {
        pantalla = montarEnRuta("/", { "/": <Navbar /> }, {
            usuario: { nombre: "Camila Rojas", correo: "camila@gmail.com", rol: "CLIENTE" }
        });

        const avatar = pantalla.querySelector(".avatar-cuenta");
        expect(avatar.textContent).toContain("CR");
        expect(avatar.getAttribute("href")).toBe("/perfil");
    });

    it("el contador del carrito suma las unidades", () => {
        pantalla = montarEnRuta("/", { "/": <Navbar /> }, {
            carrito: [{ codigo: "CL001", cantidad: 2 }, { codigo: "RG001", cantidad: 1 }]
        });

        expect(pantalla.querySelector(".carrito-total").textContent).toBe("3");
    });

});

describe("Página no encontrada (404)", () => {

    let pantalla;

    afterEach(() => {
        pantalla.desmontar();
    });

    // Se monta la App completa para probar su ruta "*" de verdad
    function abrirApp(url) {
        localStorage.removeItem(CLAVE_SESION);
        pantalla = montar(
            <MemoryRouter initialEntries={[url]}>
                <ProveedorSesion>
                    <ProveedorCatalogo>
                        <ProveedorCarrito>
                            <App />
                        </ProveedorCarrito>
                    </ProveedorCatalogo>
                </ProveedorSesion>
            </MemoryRouter>
        );
    }

    it("muestra el aviso en una dirección que no existe", () => {
        abrirApp("/esta-pagina-no-existe");

        expect(pantalla.textContent).toContain("Página no encontrada");
        expect(pantalla.textContent).toContain("/esta-pagina-no-existe");
    });

    it("no aparece en una página que sí existe", () => {
        abrirApp("/nosotros");

        expect(pantalla.textContent).not.toContain("Página no encontrada");
    });

});
