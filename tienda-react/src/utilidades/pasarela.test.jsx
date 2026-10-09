import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { montar, escribir } from "../test/ayuda";
import ProveedorSesion from "../contexto/ProveedorSesion";
import ProveedorCatalogo from "../contexto/ProveedorCatalogo";
import ProveedorCarrito from "../contexto/ProveedorCarrito";
import Checkout from "../paginas/Checkout";
import PagoRechazado from "../paginas/PagoRechazado";
import { leerPedidos } from "../datos/pedidos";
import {
    pasaLuhn,
    validarNumeroTarjeta,
    validarVencimiento,
    validarCvv,
    procesarPago,
    ultimosCuatro
} from "./pasarela";

// Pruebas de la pasarela de pago simulada: sus reglas
// y el recorrido completo del checkout (aprobado y rechazado).

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

    beforeEach(() => {
        localStorage.removeItem("usuarioActivo");
        localStorage.removeItem("productosSistema");
        localStorage.removeItem("pedidos_volcan");
        localStorage.setItem("carritoVolcan", JSON.stringify([{ codigo: "CL002", cantidad: 1 }]));

        // El "banco" tarda 1,2 segundos: el reloj falso de Vitest adelanta el tiempo
        vi.useFakeTimers();

        pantalla = montar(
            <MemoryRouter initialEntries={["/checkout"]}>
                <ProveedorSesion>
                    <ProveedorCatalogo>
                        <ProveedorCarrito>
                            <Routes>
                                <Route path="/checkout" element={<Checkout />} />
                                <Route path="/pago-rechazado" element={<PagoRechazado />} />
                                <Route path="/compra-exitosa" element={<p>Compra exitosa</p>} />
                            </Routes>
                        </ProveedorCarrito>
                    </ProveedorCatalogo>
                </ProveedorSesion>
            </MemoryRouter>
        );
    });

    afterEach(() => {
        pantalla.desmontar();
        vi.useRealTimers();
        ["usuarioActivo", "productosSistema", "pedidos_volcan", "carritoVolcan"]
            .forEach((clave) => localStorage.removeItem(clave));
    });

    // Llena el formulario con datos validos y la tarjeta indicada, y paga
    function pagarCon(tarjeta) {
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

        escribir(pantalla.querySelector("#numeroTarjeta"), tarjeta);
        escribir(pantalla.querySelector("#titular"), "Camila Rojas");
        escribir(pantalla.querySelector("#vencimiento"), "12/30");
        escribir(pantalla.querySelector("#cvv"), "123");

        const formulario = pantalla.querySelector("form");
        act(() => {
            formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        });
    }

    it("desactiva el botón mientras se procesa el pago", () => {
        pagarCon("4111 1111 1111 1111");

        const boton = pantalla.querySelector('button[type="submit"]');
        expect(boton.disabled).toBe(true);
        expect(boton.textContent).toBe("Procesando pago…");
    });

    it("con una tarjeta aprobada crea el pedido y guarda solo los últimos 4 dígitos", () => {
        pagarCon("4111 1111 1111 1111");
        act(() => { vi.advanceTimersByTime(1200); });

        expect(pantalla.textContent).toContain("Compra exitosa");

        const pedidos = leerPedidos();
        expect(pedidos.length).toBe(1);
        expect(pedidos[0].pago.tarjeta).toBe("•••• 1111");
        expect(JSON.stringify(pedidos[0])).not.toContain("4111 1111 1111 1111");
    });

    it("con una tarjeta rechazada muestra el motivo y no crea pedido", () => {
        pagarCon("4000 0000 0000 9995");
        act(() => { vi.advanceTimersByTime(1200); });

        expect(pantalla.textContent).toContain("Pago rechazado");
        expect(pantalla.textContent).toContain("Fondos insuficientes.");
        expect(leerPedidos().length).toBe(0);

        // El carrito sigue guardado para reintentar
        expect(JSON.parse(localStorage.getItem("carritoVolcan")).length).toBe(1);
    });

});
