import { describe, it, expect, afterEach } from "vitest";
import { montarEnRuta, clic } from "../test/ayuda";
import { waitFor } from "@testing-library/react";
import { simularBackendDeUsuarios } from "../test/api";
import AdminDashboard from "./AdminDashboard";
import AdminProductos from "./AdminProductos";
import AdminUsuarios from "./AdminUsuarios";

// Pruebas del panel de administracion: quien puede entrar
// y que cada vista muestre los datos del sistema.

const ADMIN = { nombre: "Sofía Pérez", correo: "admin@gaselvolcan.cl", rol: "ADMINISTRADOR" };

describe("Panel de administración: acceso", () => {

    let pantalla;

    afterEach(() => {
        pantalla.desmontar();
    });

    it("el administrador ve su panel", () => {
        pantalla = montarEnRuta("/admin", { "/admin": <AdminDashboard /> }, { usuario: ADMIN });

        expect(pantalla.querySelector("#paginaLogin")).toBeNull();
        expect(pantalla.querySelector("h1").textContent).toContain("Panel de administración");
    });

    it("el panel tiene acceso directo a órdenes", () => {
        pantalla = montarEnRuta("/admin", { "/admin": <AdminDashboard /> }, { usuario: ADMIN });

        const enlaceOrdenes = Array.from(pantalla.querySelectorAll("a"))
            .find((enlace) => enlace.textContent.trim() === "Gestionar órdenes");

        expect(enlaceOrdenes).not.toBeUndefined();
        expect(enlaceOrdenes.getAttribute("href")).toBe("/admin/ordenes");
    });

    it("el panel tiene acceso directo a reportes", () => {
        pantalla = montarEnRuta("/admin", { "/admin": <AdminDashboard /> }, { usuario: ADMIN });

        const enlaceReportes = Array.from(pantalla.querySelectorAll("a"))
            .find((enlace) => enlace.textContent.trim() === "Ver reportes");

        expect(enlaceReportes).not.toBeUndefined();
        expect(enlaceReportes.getAttribute("href")).toBe("/admin/reportes");
    });

});

describe("Panel de administración: vistas", () => {

    let pantalla;

    afterEach(() => {
        pantalla.desmontar();
    });

    it("Productos lista los 14 productos del catálogo", () => {
        pantalla = montarEnRuta("/admin/productos", { "/admin/productos": <AdminProductos /> }, { usuario: ADMIN });

        expect(pantalla.querySelectorAll(".tabla-panel tbody tr").length).toBe(14);
    });

    // Las cuentas llegan de ms-usuarios (simulado)
    it("Usuarios lista las 5 cuentas del sistema", async () => {
        simularBackendDeUsuarios();
        pantalla = montarEnRuta("/admin/usuarios", { "/admin/usuarios": <AdminUsuarios /> }, { usuario: ADMIN });

        await waitFor(() => expect(pantalla.querySelectorAll(".tabla-panel tbody tr").length).toBe(5));
    });

    it("no deja que el administrador elimine su propia cuenta", async () => {
        simularBackendDeUsuarios();
        pantalla = montarEnRuta("/admin/usuarios", { "/admin/usuarios": <AdminUsuarios /> }, { usuario: ADMIN });
        await waitFor(() => expect(pantalla.textContent).toContain("admin@gaselvolcan.cl"));

        const filaAdmin = Array.from(pantalla.querySelectorAll(".tabla-panel tbody tr"))
            .find((fila) => fila.textContent.includes("admin@gaselvolcan.cl"));
        const eliminar = Array.from(filaAdmin.querySelectorAll("button"))
            .find((boton) => boton.textContent.trim() === "Eliminar");

        clic(eliminar);

        expect(pantalla.textContent).toContain("No puedes eliminar tu propia cuenta.");
    });

});
