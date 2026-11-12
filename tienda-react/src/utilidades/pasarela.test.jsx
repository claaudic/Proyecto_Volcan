import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { montar, escribir } from "../test/ayuda";
import ProveedorSesion from "../contexto/ProveedorSesion";
import ProveedorCatalogo from "../contexto/ProveedorCatalogo";
import ProveedorCarrito from "../contexto/ProveedorCarrito";
import Checkout from "../paginas/Checkout";
import PagoRechazado from "../paginas/PagoRechazado";
import CompraExitosa from "../paginas/CompraExitosa";
import { leerPedidos } from "../datos/pedidos";
import { simularApi } from "../test/api";
import { leerIntentoCompra } from "../datos/intentoCompra";
import {
    pasaLuhn,
    validarNumeroTarjeta,
    validarVencimiento,
    validarCvv,
    procesarPago,
    ultimosCuatro
} from "./pasarela";

// Pruebas de la pasarela de pago simulada: sus reglas
// y la separación del registro HTTP de boletas respecto de la simulación bancaria.

describe("Pasarela: validaciones de la tarjeta", () => {

    it("el algoritmo de Luhn acepta números reales y rechaza los mal escritos", () => {
        expect(pasaLuhn("4111 1111 1111 1111")).toBe(true);
        expect(pasaLuhn("4111 1111 1111 1112")).toBe(false);
    });

    it("pide 16 dígitos válidos", () => {
        expect(validarNumeroTarjeta("4111 1111 1111 1111")).toBe("");
        expect(validarNumeroTarjeta("4111 1111")).toBe("El número debe tener 16 dígitos.");
        expect(validarNumeroTarjeta("4111 1111 1111 1112")).toContain("no es válido");
    });

    it("rechaza una tarjeta vencida y acepta una vigente", () => {
        const hoy = new Date(2026, 9, 8); // 8 de octubre de 2026

        expect(validarVencimiento("09/26", hoy)).toBe("La tarjeta está vencida.");
        expect(validarVencimiento("10/26", hoy)).toBe("");
        expect(validarVencimiento("13/27", hoy)).toContain("MM/AA");
    });

    it("el CVV tiene 3 dígitos", () => {
        expect(validarCvv("123")).toBe("");
        expect(validarCvv("12a")).not.toBe("");
    });

    it("el banco simulado rechaza las tarjetas de prueba con su motivo", () => {
        expect(procesarPago("4111 1111 1111 1111").aprobado).toBe(true);
        expect(procesarPago("4000 0000 0000 9995")).toEqual({ aprobado: false, motivo: "Fondos insuficientes." });
    });

    it("de la tarjeta solo se guardan los últimos 4 dígitos", () => {
        expect(ultimosCuatro("4111 1111 1111 1234")).toBe("1234");
    });

});

describe("Pasarela: checkout completo", () => {

    let pantalla;
    let api;
    let catalogoOriginal;
    let responderBoleta;
    let solicitud;
    const categoria = { id: 91, nombre: "Categoria de prueba" };
    const producto = { id: 901, codigo: "CL002", nombre: "Producto oficial de prueba",
        precioResidencial: 220, precioComercial: 200, precioOferta: null,
        stock: 3, activo: true, unidad: "Unidad", categoria };

    beforeEach(async () => {
        sessionStorage.clear();
        localStorage.removeItem("usuarioActivo");
        localStorage.removeItem("productosSistema");
        localStorage.removeItem("pedidos_volcan");
        localStorage.setItem("carritoVolcan", JSON.stringify([{ codigo: "CL002", cantidad: 1 }]));

        api = simularApi({
            "GET /productos": () => [200, [producto]],
            "GET /categorias": () => [200, [categoria]],
            "POST /boletas": cuerpo => {
                solicitud = cuerpo;
                return new Promise(resolve => { responderBoleta = resolve; });
            }
        });
        // Avanzar el antiguo plazo no debe iniciar ninguna compra simulada.
        vi.useFakeTimers();

        await act(async () => {
        pantalla = montar(
            <MemoryRouter initialEntries={["/checkout"]}>
                <ProveedorSesion>
                    <ProveedorCatalogo>
                        <ProveedorCarrito>
                            <Routes>
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/pago-rechazado" element={<PagoRechazado />} />
                                <Route path="/compra-exitosa" element={<CompraExitosa />} />
                            </Routes>
                        </ProveedorCarrito>
                    </ProveedorCatalogo>
                </ProveedorSesion>
            </MemoryRouter>
        );
        });
        expect(pantalla.textContent).toContain("Producto oficial de prueba");
        catalogoOriginal = localStorage.getItem("productosSistema");
    });

    afterEach(() => {
        pantalla.desmontar();
        sessionStorage.clear();
        vi.useRealTimers();
        ["usuarioActivo", "productosSistema", "pedidos_volcan", "carritoVolcan"]
            .forEach((clave) => localStorage.removeItem(clave));
    });

    // El registro solo usa datos personales y de entrega, sin datos de pago.
    async function registrar() {
        escribir(pantalla.querySelector("#nombre"), "Camila Rojas");
        escribir(pantalla.querySelector("#correo"), "camila@gmail.com");
        escribir(pantalla.querySelector("#telefono"), "+56 9 1234 5678");
        escribir(pantalla.querySelector("#direccion"), "Libertad 123");

        // El select avisa sus cambios con el evento "change"
        const comuna = pantalla.querySelector("#comuna");
        act(() => {
            comuna.value = "Chillán";
            comuna.dispatchEvent(new Event("change", { bubbles: true }));
        });

        expect(pantalla.querySelector("#numeroTarjeta")).toBeNull();
        expect(pantalla.querySelector("#titular")).toBeNull();
        expect(pantalla.querySelector("#vencimiento")).toBeNull();
        expect(pantalla.querySelector("#cvv")).toBeNull();

        const formulario = pantalla.querySelector("form");
        await act(async () => {
            formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
    }

    async function responder(estado = 201) {
        await act(async () => {
            responderBoleta(estado === 201 ? [201, {
                id: 81, clienteId: solicitud.clienteId, direccion: solicitud.direccion, comuna: solicitud.comuna,
                fecha: solicitud.fecha, estado: "PENDIENTE", repartidorId: null, total: 220,
                detalles: [{ id: 101, productoId: 901, cantidad: 1, precio: 220 }]
            }] : [estado, { mensaje: "Registro temporalmente no disponible." }]);
        });
    }

    function comprobarConservacion(numeroPosts = 1, confirmado = false) {
        expect(Boolean(pantalla.querySelector("form"))).toBe(!confirmado);
        expect(leerPedidos()).toEqual([]);
        expect(localStorage.getItem("pedidos_volcan")).toBeNull();
        expect(localStorage.getItem("productosSistema")).toBe(catalogoOriginal);
        expect(producto.stock).toBe(3);
        expect(JSON.parse(localStorage.getItem("carritoVolcan"))).toEqual(confirmado ? [] : [{ codigo: "CL002", cantidad: 1 }]);
        const posts = api.mock.calls.filter(([, opciones]) => opciones.method === "POST");
        expect(api).toHaveBeenCalledTimes(4 + numeroPosts);
        expect(api.mock.calls.filter(([, opciones]) => opciones.method === "GET")).toHaveLength(4);
        expect(posts).toHaveLength(numeroPosts);
        for (const [url, opciones] of posts) {
            expect(String(url)).toMatch(/\/api\/v1\/boletas$/);
            expect(opciones.headers['idempotency-key']).toBe(posts[0][1].headers['idempotency-key']);
            expect(opciones.headers.Authorization).toBeUndefined();
            expect(JSON.parse(opciones.body)).toMatchObject({ clienteId: null, detalles: [{ productoId: 901, cantidad: 1 }] });
            expect(opciones.body).not.toMatch(/numeroTarjeta|cvv|titular|vencimiento|4111|9995/);
        }
        const almacenado = JSON.stringify({ local: { ...localStorage }, sesion: { ...sessionStorage } });
        expect(almacenado).not.toMatch(/4111 1111 1111 1111|4000 0000 0000 9995|•••• 1111|"cvv"|numeroTarjeta/);
        expect(pantalla.textContent).not.toContain("Pago rechazado");
        expect(pantalla.textContent).not.toContain("Fondos insuficientes.");
        expect(pantalla.textContent).not.toContain("Compra exitosa");
        expect(pantalla.textContent).not.toContain("Total pagado");
        expect(pantalla.textContent).not.toContain("Pagado con");
    }

    it("bloquea doble envío mientras registra y no vuelve a enviar una boleta confirmada", async () => {
        expect(pantalla.querySelector('button[type="submit"]').disabled).toBe(false);
        expect(api.mock.calls.every(([, opciones]) => opciones.method === "GET")).toBe(true);
        await registrar();

        const boton = pantalla.querySelector('button[type="submit"]');
        expect(boton.disabled).toBe(true);
        expect(boton.textContent).toBe("Procesando pedido…");
        await act(async () => {
            pantalla.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
        comprobarConservacion();
        await responder();
        expect(pantalla.textContent).toContain("Pedido registrado con éxito");
        expect(boton.disabled).toBe(true);
        expect(leerIntentoCompra()).toBeNull();
        comprobarConservacion(1, true);
    });

    it("un registro HTTP 201 no simula pago, no crea pedidos locales ni guarda datos bancarios", async () => {
        await registrar();
        await responder();
        act(() => { vi.advanceTimersByTime(1200); });

        expect(pantalla.textContent).toContain("Pedido registrado con éxito");
        comprobarConservacion(1, true);
    });

    it("un fallo HTTP conserva el intento y reintenta sin inventar un rechazo bancario", async () => {
        await registrar();
        await responder(503);
        const original = leerIntentoCompra();
        act(() => { vi.advanceTimersByTime(1200); });

        expect(pantalla.querySelector('button[type="submit"]').disabled).toBe(false);
        expect(pantalla.querySelector('button[type="submit"]').textContent).toBe("Reintentar registro");
        expect(original.estado).toBe("incierto");
        expect(pantalla.textContent).not.toContain("Boleta registrada N.º 81");
        comprobarConservacion();
        await act(async () => {
            pantalla.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
        const posts = api.mock.calls.filter(([, opciones]) => opciones.method === "POST");
        expect(posts[0][1]).toEqual(posts[1][1]);
        expect(leerIntentoCompra().cuerpo).toEqual(original.cuerpo);
        await responder();
        comprobarConservacion(2, true);
    });

});
