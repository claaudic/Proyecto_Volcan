import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CompraExitosa from "./CompraExitosa";
import { montar } from "../test/ayuda";

describe("CompraExitosa", () => {

    let pantalla;

    beforeEach(() => {
        const pedido = {
            numero: 1,
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
            }
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
    });

    it("muestra el total del pedido", () => {
        expect(pantalla.textContent).toContain("$12.000");
    });

});