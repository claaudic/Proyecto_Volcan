import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CompraExitosa from "./CompraExitosa";
import { montar } from "../test/ayuda";
import { prepararCompra } from '../datos/boletasApi';
import { cambiarEstadoIntento, leerIntentoCompra } from '../datos/intentoCompra';

describe("CompraExitosa", () => {

    let pantalla;

    beforeEach(() => {
        sessionStorage.clear();
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
        sessionStorage.clear();
    });

    it("muestra el total del pedido", () => {
        expect(pantalla.textContent).toContain("$12.000");
    });

    it("confirma el registro sin afirmar que hubo pago bancario", () => {
        expect(pantalla.textContent).toContain("Pedido registrado con éxito");
        expect(pantalla.textContent).toContain("Tu pedido fue registrado correctamente.");
        expect(pantalla.textContent).not.toContain("Total pagado");
        expect(pantalla.textContent).not.toContain("Pagado con");
    });

    it.each(['confirmado', 'incierto'])("solo libera un intento confirmado al mostrar el pedido, estado %s", estado => {
        const intento = prepararCompra({
            items: [{ codigo: 'CL002', cantidad: 1 }],
            productos: [{ id: 901, codigo: 'CL002', activo: true, stock: 3 }],
            entrega: { direccion: 'Libertad 123', comuna: 'Chillán' },
            invitado: { nombre: 'Persona Prueba', correo: 'persona@example.test', telefono: '+56912345678' }
        });
        cambiarEstadoIntento(intento.clave, 'enviado');
        cambiarEstadoIntento(intento.clave, estado, { boletaId: estado === 'confirmado' ? 1 : null });
        pantalla.desmontar();
        const pedido = { numero: 1, productos: [], total: 0, entrega: { direccion: 'Libertad 123', comuna: 'Chillán' } };
        pantalla = montar(<MemoryRouter initialEntries={[{ pathname: '/compra-exitosa', state: { pedido } }]}>
            <CompraExitosa />
        </MemoryRouter>);
        if (estado === 'confirmado') expect(leerIntentoCompra()).toBeNull();
        else expect(leerIntentoCompra()).toMatchObject({ clave: intento.clave, estado: 'incierto' });
    });

});
