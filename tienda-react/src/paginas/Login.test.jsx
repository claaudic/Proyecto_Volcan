import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { renderizar } from "../test/renderizar";
import { simularApi, simularApiApagada, respuestaLogin, CUENTAS } from "../test/api";
import ProveedorSesion from "../contexto/ProveedorSesion";
import Login from "./Login";
import { panelDeRol, CLAVE_SESION } from "../datos/usuarios";

// Pruebas del login contra ms-usuarios (simulado con un fetch falso):
// a donde lleva a cada rol, que se guarde el token y los mensajes de error.

// El backend de mentira: acepta a la administradora y a Camila con sus claves de la EP2
function backendDeLogin() {
    const claves = { "admin@gaselvolcan.cl": ["Admin1234", CUENTAS.admin], "camila@gmail.com": ["Clien1234", CUENTAS.camila] };

    return simularApi({
        "POST /auth/login": ({ correo, contrasena }) => {
            const [clave, cuenta] = claves[correo] || [];
            return clave === contrasena
                ? [200, respuestaLogin(cuenta)]
                : [401, { estado: 401, mensaje: "Correo o contraseña incorrectos." }];
        }
    });
}

async function entrarCon(user, correo, contrasena) {
    await user.type(screen.getByLabelText(/Correo/), correo);
    await user.type(screen.getByLabelText(/Contraseña/), contrasena);
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
}

describe("Login: redirección por rol", () => {

    // Paginas de mentira: solo para saber a donde nos llevo el login
    function abrirLogin() {
        render(
            <MemoryRouter initialEntries={["/login"]}>
                <ProveedorSesion>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<p>Inicio</p>} />
                        <Route path="/admin" element={<p>Panel admin</p>} />
                    </Routes>
                </ProveedorSesion>
            </MemoryRouter>
        );
    }

    it("el administrador llega a su panel y se guarda su token", async () => {
        const api = backendDeLogin();
        const user = userEvent.setup();
        abrirLogin();

        await entrarCon(user, "admin@gaselvolcan.cl", "Admin1234");

        expect(await screen.findByText("Panel admin")).toBeInTheDocument();
        // Por el API Gateway (8080), nunca directo a ms-usuarios (8081)
        expect(api).toHaveBeenCalledWith("http://localhost:8080/api/v1/auth/login", expect.objectContaining({ method: "POST" }));

        const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION));
        expect(sesion.token.split(".")).toHaveLength(3);
        expect(sesion.usuario).toEqual({ id: 1, nombre: "Sofía Pérez", correo: "admin@gaselvolcan.cl", rol: "ADMINISTRADOR" });
    });

    it("el cliente vuelve a la tienda", async () => {
        backendDeLogin();
        const user = userEvent.setup();
        abrirLogin();

        await entrarCon(user, "camila@gmail.com", "Clien1234");

        expect(await screen.findByText("Inicio")).toBeInTheDocument();
    });

});

describe("Login: paneles por rol", () => {

    it("el administrador tiene panel y los clientes no", () => {
        expect(panelDeRol("ADMINISTRADOR")).toBe("/admin");
        expect(panelDeRol("DESPACHADORA")).toBe("/despacho");
        expect(panelDeRol("REPARTIDOR")).toBe("/repartidor");
        expect(panelDeRol("CLIENTE")).toBeNull();
    });

});

describe("Login: errores", () => {

    it("muestra el mensaje del backend si la contraseña es incorrecta", async () => {
        backendDeLogin();
        const user = userEvent.setup();
        renderizar(<Login />);

        await entrarCon(user, "camila@gmail.com", "Mala123");

        expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument();
        expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    });

    it("no deja entrar a una cuenta desactivada", async () => {
        simularApi({
            "POST /auth/login": () => [401, { estado: 401, mensaje: "La cuenta está desactivada. Contacta al administrador." }]
        });
        const user = userEvent.setup();
        renderizar(<Login />);

        await entrarCon(user, "camila@gmail.com", "Clien1234");

        expect(await screen.findByText("La cuenta está desactivada. Contacta al administrador.")).toBeInTheDocument();
    });

    it("avisa si el servidor no responde", async () => {
        simularApiApagada();
        const user = userEvent.setup();
        renderizar(<Login />);

        await entrarCon(user, "camila@gmail.com", "Clien1234");

        expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar con el servidor");
        expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled();
    });

    it("propone el correo del equipo si el dominio no está permitido", async () => {
        const user = userEvent.setup();
        renderizar(<Login />);

        await user.type(screen.getByLabelText(/Correo/), "admin@gmail.cl");
        await user.click(screen.getByRole("button", { name: "¿Quisiste decir admin@gaselvolcan.cl?" }));

        expect(screen.getByLabelText(/Correo/)).toHaveValue("admin@gaselvolcan.cl");
    });

});
