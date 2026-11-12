import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CompraExitosa from "./CompraExitosa";
import { montar, clic } from "../test/ayuda";

describe("CompraExitosa", () => {

    let pantalla;

    beforeEach(() => {
        const pedido = {
            numero: 1,
            fecha: "2026-11-12T11:00:00",
            productos: [
                {
                    codigo: "CL002",
                    nombre: "Cilindro GLP 11 kg",
                    cantidad: 1,
                    subtotal: 12000
                }
            ],
            total: 12000,
            entrega: {
                direccion: "Av. Libertad 123",
                comuna: "Chillán",
                indicaciones: ""
            },
            cliente: { nombre: "Pedro Soto", correo: "pedro@gmail.com", telefono: "" },
            pago: { tarjeta: "•••• 1111" }
        };

        pantalla = montar(
            <MemoryRouter
                initialEntries={[
                    {
                        pathname: "/compra-exitosa",
                        state: { pedido }
                    }
                ]}
            >
                <CompraExitosa />
            </MemoryRouter>
        );
    });

    afterEach(() => {
        pantalla.desmontar();
        vi.restoreAllMocks();
    });

    it("muestra el total del pedido", () => {
        expect(pantalla.textContent).toContain("$12.000");
    });

    it("muestra el estado real, la fecha de la boleta y el mensaje de preparación", () => {
        expect(pantalla.textContent).toContain("Pendiente de despacho");
        expect(pantalla.textContent).toContain("Estamos preparando tu pedido");
        expect(pantalla.textContent).toContain("12-11-2026");
        expect(pantalla.textContent).toContain("Tarjeta •••• 1111");
    });

    it("el camión es decoración: los lectores de pantalla lo saltan", () => {
        const escena = pantalla.querySelector(".camion-escena");

        expect(escena).not.toBeNull();
        expect(escena.getAttribute("aria-hidden")).toBe("true");
    });

    it("arma el comprobante para descargar con número, productos, total y datos", () => {
        const comprobante = pantalla.querySelector(".comprobante");

        expect(comprobante.textContent).toContain("Comprobante de pedido");
        expect(comprobante.textContent).toContain("N° 000001");
        expect(comprobante.textContent).toContain("Cilindro GLP 11 kg");
        expect(comprobante.textContent).toContain("$12.000");
        expect(comprobante.textContent).toContain("pedro@gmail.com");
        expect(comprobante.textContent).toContain("Av. Libertad 123");
        expect(comprobante.textContent).toContain("No reemplaza a la boleta electrónica");
    });

    it("Descargar comprobante abre la ventana de imprimir", () => {
        let tituloAlImprimir = "";
        document.title = "Gas El Volcán";
        const imprimir = vi.spyOn(window, "print").mockImplementation(() => { tituloAlImprimir = document.title; });
        const boton = Array.from(pantalla.querySelectorAll("button"))
            .find((b) => b.textContent.includes("Descargar comprobante"));

        clic(boton);

        expect(imprimir).toHaveBeenCalledTimes(1);
        // El PDF se llama con el número de pedido; después vuelve el título normal
        expect(tituloAlImprimir).toBe("Comprobante pedido 000001 - Gas El Volcán");
        expect(document.title).toBe("Gas El Volcán");
    });

});

describe("CompraExitosa sin pedido", () => {

    it("avisa que no hay información y no muestra el camión", () => {
        const pantalla = montar(
            <MemoryRouter initialEntries={["/compra-exitosa"]}>
                <CompraExitosa />
            </MemoryRouter>
        );

        expect(pantalla.textContent).toContain("No hay información de la compra");
        expect(pantalla.querySelector(".camion-escena")).toBeNull();
        pantalla.desmontar();
    });

});
