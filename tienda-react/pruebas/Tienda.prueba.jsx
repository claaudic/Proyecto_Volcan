import { act } from "react";
import { montarEnRuta, escribir } from "./ayuda";
import Inicio from "../src/paginas/Inicio";
import DetalleProducto from "../src/paginas/DetalleProducto";
import Registro from "../src/paginas/Registro";
import Navbar from "../src/components/Navbar";
import { buscarCuenta } from "../src/datos/usuarios";

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

    it("con datos válidos crea la cuenta y lleva al inicio", () => {
        escribir(pantalla.querySelector("#nombre"), "Ana");
        escribir(pantalla.querySelector("#apellidos"), "Soto");
        escribir(pantalla.querySelector("#correo"), "ana.soto@gmail.com");
        escribir(pantalla.querySelector("#contrasena"), "Ana1234");
        escribir(pantalla.querySelector("#repetir"), "Ana1234");
        enviar();

        expect(pantalla.querySelector("#paginaInicio")).not.toBeNull();
        expect(buscarCuenta("ana.soto@gmail.com", "Ana1234")).not.toBeNull();
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
