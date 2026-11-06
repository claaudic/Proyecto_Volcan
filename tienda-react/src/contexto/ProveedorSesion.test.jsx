import { describe, it, expect, vi, afterEach } from "vitest";
import { useEffect } from "react";
import { act, render, screen } from "@testing-library/react";
import ProveedorSesion from "./ProveedorSesion";
import { useSesion } from "./sesionContexto";
import { CLAVE_SESION } from "../datos/usuarios";
import { simularApi, respuestaLogin, guardarSesionDePrueba, CUENTAS } from "../test/api";
import { leerToken, msHastaVencer } from "../utilidades/api";

// Pruebas de la sesion con token: se recupera al recargar, se renueva sola
// antes de vencer y se cierra si el token ya no sirve.

const CAMILA = { id: 5, nombre: "Camila Rojas", correo: "camila@gmail.com", rol: "CLIENTE" };

// Muestra quien tiene la sesion y entrega el contexto a la prueba
let sesion;
function Espia({ alCambiar }) {
    const actual = useSesion();
    useEffect(() => alCambiar(actual));
    return <p>{actual.usuario ? "Sesión de " + actual.usuario.nombre : "Sin sesión"}</p>;
}

function montar() {
    return render(<ProveedorSesion><Espia alCambiar={(actual) => { sesion = actual; }} /></ProveedorSesion>);
}

afterEach(() => {
    vi.useRealTimers();
});

describe("Sesión: al recargar la página", () => {

    it("recupera la sesión si el token sigue vigente", () => {
        guardarSesionDePrueba(CAMILA);
        montar();

        expect(screen.getByText("Sesión de Camila Rojas")).toBeInTheDocument();
        expect(sesion.token).not.toBeNull();
    });

    it("si el token ya venció, pide iniciar sesión de nuevo", () => {
        guardarSesionDePrueba(CAMILA, -1);
        montar();

        expect(screen.getByText("Sin sesión")).toBeInTheDocument();
        expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    });

    it("una sesión antigua sin token no sirve", () => {
        localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario: CAMILA }));
        montar();

        expect(screen.getByText("Sin sesión")).toBeInTheDocument();
    });

});

describe("Sesión: renovación del token", () => {

    it("1 minuto antes de vencer pide un token nuevo con /auth/renovar", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        guardarSesionDePrueba(CAMILA, 30);
        const tokenAnterior = JSON.parse(localStorage.getItem(CLAVE_SESION)).token;
        const api = simularApi({ "POST /auth/renovar": () => [200, respuestaLogin(CUENTAS.camila, 60)] });
        montar();

        await act(() => vi.advanceTimersByTimeAsync(29 * 60 * 1000));

        expect(api.mock.calls[0][1].headers.Authorization).toBe("Bearer " + tokenAnterior);
        const tokenNuevo = JSON.parse(localStorage.getItem(CLAVE_SESION)).token;
        expect(tokenNuevo).not.toBe(tokenAnterior);
        expect(screen.getByText("Sesión de Camila Rojas")).toBeInTheDocument();
    });

    it("si la renovación falla, cierra la sesión", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        guardarSesionDePrueba(CAMILA, 30);
        simularApi({ "POST /auth/renovar": () => [401, { estado: 401, mensaje: "La cuenta está desactivada." }] });
        montar();

        await act(() => vi.advanceTimersByTimeAsync(29 * 60 * 1000));

        expect(screen.getByText("Sin sesión")).toBeInTheDocument();
        expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    });

});

describe("Sesión: llamadas protegidas y logout", () => {

    it("llamarApi envía el token y, si el backend responde 401, cierra la sesión", async () => {
        guardarSesionDePrueba(CAMILA);
        const api = simularApi({ "GET /usuarios/yo": () => [401, { estado: 401, mensaje: "El token no es válido o ya venció." }] });
        montar();

        await act(async () => {
            await expect(sesion.llamarApi("/usuarios/yo")).rejects.toThrow("El token no es válido o ya venció.");
        });

        expect(api.mock.calls[0][1].headers.Authorization).toMatch(/^Bearer /);
        expect(screen.getByText("Sin sesión")).toBeInTheDocument();
    });

    it("un 403 no cierra la sesión", async () => {
        guardarSesionDePrueba(CAMILA);
        simularApi({ "GET /usuarios": () => [403, { estado: 403, mensaje: "No tienes permiso para realizar esta acción." }] });
        montar();

        await act(async () => {
            await expect(sesion.llamarApi("/usuarios")).rejects.toMatchObject({ estado: 403 });
        });

        expect(screen.getByText("Sesión de Camila Rojas")).toBeInTheDocument();
    });

    it("cerrarSesion borra el token y los datos", () => {
        guardarSesionDePrueba(CAMILA);
        montar();

        act(() => sesion.cerrarSesion());

        expect(screen.getByText("Sin sesión")).toBeInTheDocument();
        expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    });

    it("actualizarUsuario cambia el nombre sin perder el token", () => {
        guardarSesionDePrueba(CAMILA);
        montar();

        act(() => sesion.actualizarUsuario({ nombre: "Camila Rojas Díaz" }));

        const guardada = JSON.parse(localStorage.getItem(CLAVE_SESION));
        expect(guardada.usuario.nombre).toBe("Camila Rojas Díaz");
        expect(guardada.token).not.toBeNull();
    });

});

describe("Lectura del token", () => {

    it("lee el correo, el rol y cuánto le queda", () => {
        const { token } = respuestaLogin(CUENTAS.admin, 30);

        expect(leerToken(token)).toMatchObject({ sub: "admin@gaselvolcan.cl", rol: "ADMINISTRADOR" });
        expect(msHastaVencer(token)).toBeGreaterThan(29 * 60 * 1000);
    });

    it("un texto que no es token se considera vencido", () => {
        expect(leerToken("no-es-un-token")).toBeNull();
        expect(msHastaVencer("no-es-un-token")).toBe(0);
    });

});
