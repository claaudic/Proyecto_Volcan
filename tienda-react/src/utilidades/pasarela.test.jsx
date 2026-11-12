import { describe, it, expect } from "vitest";
import {
    pasaLuhn,
    validarNumeroTarjeta,
    validarVencimiento,
    validarCvv,
    procesarPago,
    ultimosCuatro,
    formatearVencimiento,
    formatearNumeroTarjeta
} from "./pasarela";

// Reglas de la pasarela de pago simulada.
// El flujo completo del checkout (pago + POST /boletas) se prueba en paginas/CheckoutCompra.test.jsx.

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

    it("al escribir el vencimiento pone la / sola y deja borrarla", () => {
        expect(formatearVencimiento("1")).toBe("1");
        expect(formatearVencimiento("12", "1")).toBe("12/");
        expect(formatearVencimiento("12/2", "12/")).toBe("12/2");
        expect(formatearVencimiento("1228")).toBe("12/28");
        expect(formatearVencimiento("12/289")).toBe("12/28");
        // Al borrar desde "12/" no vuelve a aparecer la barra
        expect(formatearVencimiento("12", "12/")).toBe("12");
    });

    it("al escribir el número de la tarjeta lo separa de a 4", () => {
        expect(formatearNumeroTarjeta("4111")).toBe("4111");
        expect(formatearNumeroTarjeta("41111")).toBe("4111 1");
        expect(formatearNumeroTarjeta("4111111111111111")).toBe("4111 1111 1111 1111");
        // Letras y números de más se ignoran
        expect(formatearNumeroTarjeta("4111-1111 1111 1111 99a")).toBe("4111 1111 1111 1111");
        // Borrar el último dígito de un grupo no deja un espacio colgando
        expect(formatearNumeroTarjeta("4111 ")).toBe("4111");
    });

});
