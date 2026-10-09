import { describe, it, expect, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderizar } from "../test/renderizar";
import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { montar, escribir } from "../test/ayuda";
import ProveedorSesion from "../contexto/ProveedorSesion";
import Login from "./Login";
import { panelDeRol } from "../datos/usuarios";

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

describe("Login: errores", () => {

    async function entrarCon(user, correo, contrasena) {
        await user.type(screen.getByLabelText(/Correo/), correo);
        await user.type(screen.getByLabelText(/Contraseña/), contrasena);
        await user.click(screen.getByRole("button", { name: /Ingresar|Iniciar sesión|Entrar/ }));
    }

    it("avisa si la contraseña es incorrecta", async () => {
        const user = userEvent.setup();
        renderizar(<Login />);

        await entrarCon(user, "camila@gmail.com", "Mala123");

        expect(screen.getByText("El correo o la contraseña son incorrectos.")).toBeInTheDocument();
        expect(localStorage.getItem("usuarioActivo")).toBeNull();
    });

    it("no deja entrar a una cuenta desactivada", async () => {
        localStorage.setItem("usuariosSistema", JSON.stringify([{
            nombre: "Camila Rojas", correo: "camila@gmail.com", contrasena: "Clien1234", rol: "CLIENTE", activo: false
        }]));
        const user = userEvent.setup();
        renderizar(<Login />);

        await entrarCon(user, "camila@gmail.com", "Clien1234");

        expect(screen.getByText("Tu cuenta está desactivada. Contacta al administrador.")).toBeInTheDocument();
    });

    it("propone el correo del equipo si el dominio no está permitido", async () => {
        const user = userEvent.setup();
        renderizar(<Login />);

        await user.type(screen.getByLabelText(/Correo/), "admin@gmail.cl");
        await user.click(screen.getByRole("button", { name: "¿Quisiste decir admin@gaselvolcan.cl?" }));

        expect(screen.getByLabelText(/Correo/)).toHaveValue("admin@gaselvolcan.cl");
    });

});
