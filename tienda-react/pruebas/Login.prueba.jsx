import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { montar, escribir } from "./ayuda";
import ProveedorSesion from "../src/contexto/ProveedorSesion";
import Login from "../src/paginas/Login";
import { panelDeRol } from "../src/datos/usuarios";

// Pruebas del login: a donde lleva a cada rol despues de entrar.

describe("Login: redirección por rol", () => {

    let pantalla;

    // Paginas de mentira: solo para saber a donde nos llevo el login
    function abrirLogin() {
        localStorage.removeItem("usuarioActivo");

        pantalla = montar(
            <MemoryRouter initialEntries={["/login"]}>
                <ProveedorSesion>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<p id="destino">Inicio</p>} />
                        <Route path="/admin" element={<p id="destino">Panel admin</p>} />
                    </Routes>
                </ProveedorSesion>
            </MemoryRouter>
        );
    }

    function entrar(correo, contrasena) {
        escribir(pantalla.querySelector("#correo"), correo);
        escribir(pantalla.querySelector("#contrasena"), contrasena);

        const formulario = pantalla.querySelector("form");
        act(() => {
            formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
    }

    afterEach(() => {
        pantalla.desmontar();
        localStorage.removeItem("usuarioActivo");
    });

    it("el administrador llega a su panel", () => {
        abrirLogin();
        entrar("admin@gaselvolcan.cl", "Admin1234");

        expect(pantalla.querySelector("#destino").textContent).toBe("Panel admin");
    });

    it("el cliente vuelve a la tienda", () => {
        abrirLogin();
        entrar("camila@gmail.com", "Clien1234");

        expect(pantalla.querySelector("#destino").textContent).toBe("Inicio");
    });

});

describe("Login: paneles por rol", () => {

    it("el administrador tiene panel y los clientes no", () => {
        expect(panelDeRol("ADMINISTRADOR")).toBe("/admin");
        expect(panelDeRol("CLIENTE")).toBeNull();
    });

});
