import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Checkout from './Checkout'
import CompraExitosa from './CompraExitosa'
import PagoRechazado from './PagoRechazado'
import ProveedorSesion from '../contexto/ProveedorSesion'
import ProveedorCatalogo from '../contexto/ProveedorCatalogo'
import ProveedorCarrito from '../contexto/ProveedorCarrito'
import { simularApi, guardarSesionDePrueba, CUENTAS } from '../test/api'

// Flujo completo del checkout: pasarela simulada + POST /boletas por el Gateway

const categoria = { id: 91, nombre: 'Categoría de prueba' }
const producto = {
    id: 901, codigo: 'CL002', nombre: 'Cilindro de prueba', precioResidencial: 22000,
    precioComercial: 20000, precioOferta: null, stock: 3, activo: true, unidad: 'Unidad', categoria
}

// Respuesta 201 del backend, con el total calculado por él
function boletaCreada(cuerpo) {
    return [201, {
        id: 77, clienteId: cuerpo.clienteId, direccion: cuerpo.direccion, comuna: cuerpo.comuna,
        estado: 'PENDIENTE', repartidorId: null, fecha: cuerpo.fecha, total: 22000,
        detalles: [{ id: 1, productoId: 901, cantidad: 1, precio: 22000 }]
    }]
}

function simular(rutas = {}, p = producto) {
    return simularApi({
        'GET /productos': () => [200, [p]],
        'GET /categorias': () => [200, [categoria]],
        ...rutas
    })
}

function abrir() {
    localStorage.setItem('carritoVolcan', JSON.stringify([{ codigo: 'CL002', cantidad: 1 }]))
    render(
        <MemoryRouter initialEntries={['/checkout']}>
            <ProveedorSesion>
                <ProveedorCatalogo>
                    <ProveedorCarrito>
                        <Routes>
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/compra-exitosa" element={<CompraExitosa />} />
                            <Route path="/pago-rechazado" element={<PagoRechazado />} />
                        </Routes>
                    </ProveedorCarrito>
                </ProveedorCatalogo>
            </ProveedorSesion>
        </MemoryRouter>
    )
}

const pagar = () => screen.getByRole('button', { name: 'Pagar y confirmar' })
const carritoGuardado = () => JSON.parse(localStorage.getItem('carritoVolcan') || '[]')
const llamadasA = (api, ruta) => api.mock.calls.filter(([url, op]) => op?.method === 'POST' && String(url).endsWith(ruta))

async function completar(usuario, tarjeta = '4111 1111 1111 1111', { invitado = true } = {}) {
    if (invitado) {
        await usuario.type(screen.getByLabelText('Nombre'), 'Pedro Soto')
        await usuario.type(screen.getByLabelText('Correo electrónico'), 'pedro@gmail.com')
        await usuario.type(screen.getByLabelText('Teléfono'), '+56 9 1234 5678')
    }
    await usuario.type(screen.getByLabelText('Dirección'), 'Libertad 123')
    await usuario.selectOptions(screen.getByLabelText('Comuna'), 'Chillán')
    await usuario.type(screen.getByLabelText('Número de la tarjeta'), tarjeta.replaceAll(' ', ''))
    // Se escribe solo con números: los espacios aparecen solos
    expect(screen.getByLabelText('Número de la tarjeta')).toHaveValue(tarjeta)
    await usuario.type(screen.getByLabelText('Nombre del titular'), 'Pedro Soto')
    // Solo números: la "/" se agrega sola
    await usuario.type(screen.getByLabelText('Vencimiento'), '1240')
    expect(screen.getByLabelText('Vencimiento')).toHaveValue('12/40')
    await usuario.type(screen.getByLabelText('CVV'), '123')
}

describe('Checkout: pago y registro de la boleta', () => {

    beforeEach(() => localStorage.clear())

    it('valida el formulario y la tarjeta antes de enviar nada', async () => {
        const api = simular()
        const usuario = userEvent.setup()
        abrir()
        await screen.findByText('Cilindro de prueba')

        await usuario.click(pagar())

        expect(screen.getByLabelText('Nombre')).toHaveClass('campo-invalido')
        expect(screen.getByText('Ingresa el número de la tarjeta.')).toBeInTheDocument()
        expect(llamadasA(api, '/boletas')).toHaveLength(0)
    })

    it('invitado con tarjeta aprobada: crea la boleta, vacía el carrito y muestra el pago', async () => {
        let solicitud
        const api = simular({
            'POST /boletas': (cuerpo, encabezados) => {
                solicitud = { cuerpo, encabezados }
                return boletaCreada(cuerpo)
            }
        })
        const usuario = userEvent.setup()
        abrir()
        await screen.findByText('Cilindro de prueba')

        await completar(usuario)
        await usuario.click(pagar())

        expect(await screen.findByText('Compra realizada con éxito')).toBeInTheDocument()
        expect(screen.getByText('#77')).toBeInTheDocument()
        // Aparecen en la página y en el comprobante para descargar
        expect(screen.getAllByText('Total pagado')).toHaveLength(2)
        expect(screen.getAllByText('Tarjeta •••• 1111')).toHaveLength(2)
        expect(screen.getByText('N° 000077')).toBeInTheDocument()
        expect(carritoGuardado()).toEqual([])

        // Lo que llegó al backend: ids reales, datos del invitado y la clave de idempotencia
        expect(llamadasA(api, '/boletas')).toHaveLength(1)
        expect(solicitud.encabezados['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/)
        expect(solicitud.cuerpo).toMatchObject({
            clienteId: null, direccion: 'Libertad 123', comuna: 'Chillán', estado: 'PENDIENTE',
            detalles: [{ productoId: 901, cantidad: 1 }],
            nombreInvitado: 'Pedro Soto', correoInvitado: 'pedro@gmail.com', telefonoInvitado: '+56 9 1234 5678'
        })
        // La tarjeta nunca viaja al backend
        expect(JSON.stringify(solicitud.cuerpo)).not.toContain('4111')
    })

    it('tarjeta rechazada: va a pago rechazado, no crea boleta y conserva el carrito', async () => {
        const api = simular()
        const usuario = userEvent.setup()
        abrir()
        await screen.findByText('Cilindro de prueba')

        await completar(usuario, '4000 0000 0000 9995')
        await usuario.click(pagar())

        expect(await screen.findByText('Pago rechazado')).toBeInTheDocument()
        expect(screen.getByText('Fondos insuficientes.')).toBeInTheDocument()
        expect(llamadasA(api, '/boletas')).toHaveLength(0)
        expect(carritoGuardado()).toEqual([{ codigo: 'CL002', cantidad: 1 }])
    })

    it('si el backend rechaza la compra (400), muestra el motivo y deja corregir', async () => {
        const claves = []
        simular({
            'POST /boletas': (cuerpo, encabezados) => {
                claves.push(encabezados['idempotency-key'])
                return claves.length === 1
                    ? [400, { estado: 400, mensaje: 'Stock insuficiente para Cilindro de prueba.' }]
                    : boletaCreada(cuerpo)
            }
        })
        const usuario = userEvent.setup()
        abrir()
        await screen.findByText('Cilindro de prueba')

        await completar(usuario)
        await usuario.click(pagar())

        expect(await screen.findByText('Stock insuficiente para Cilindro de prueba.')).toBeInTheDocument()
        expect(pagar()).toBeEnabled()
        expect(carritoGuardado()).toEqual([{ codigo: 'CL002', cantidad: 1 }])

        // Un 400 es definitivo: el nuevo intento es otra compra, con otra clave
        await usuario.click(pagar())
        expect(await screen.findByText('Compra realizada con éxito')).toBeInTheDocument()
        expect(claves[1]).not.toBe(claves[0])
    })

    it('si el servidor no responde bien (503), el reintento usa la misma clave', async () => {
        const claves = []
        simular({
            'POST /boletas': (cuerpo, encabezados) => {
                claves.push(encabezados['idempotency-key'])
                return claves.length === 1
                    ? [503, { estado: 503, mensaje: 'Servicio no disponible.' }]
                    : boletaCreada(cuerpo)
            }
        })
        const usuario = userEvent.setup()
        abrir()
        await screen.findByText('Cilindro de prueba')

        await completar(usuario)
        await usuario.click(pagar())
        expect(await screen.findByText('Servicio no disponible.')).toBeInTheDocument()

        // No sabemos si se creó: con la misma clave el backend no duplica la boleta
        await usuario.click(pagar())
        expect(await screen.findByText('Compra realizada con éxito')).toBeInTheDocument()
        expect(claves[1]).toBe(claves[0])
    })

    it('un cliente con sesión y sin teléfono puede comprar; el backend toma su id del token', async () => {
        let solicitud
        guardarSesionDePrueba({ nombre: 'Camila Rojas', correo: 'camila@gmail.com', rol: 'CLIENTE', id: 5 })
        simular({
            'GET /usuarios/yo': () => [200, { ...CUENTAS.camila, telefono: null, direccion: 'Libertad 123', comuna: 'chillan' }],
            'POST /boletas': (cuerpo, encabezados) => {
                solicitud = { cuerpo, encabezados }
                return boletaCreada(cuerpo)
            }
        })
        const usuario = userEvent.setup()
        abrir()
        await screen.findByText('Cilindro de prueba')
        await waitFor(() => expect(screen.getByLabelText('Dirección')).toHaveValue('Libertad 123'))

        expect(screen.getByLabelText('Nombre')).toHaveAttribute('readonly')
        expect(screen.getByLabelText('Teléfono (opcional)')).not.toHaveAttribute('readonly')

        await completar(usuario, '4111 1111 1111 1111', { invitado: false })
        await usuario.click(pagar())

        expect(await screen.findByText('Compra realizada con éxito')).toBeInTheDocument()
        expect(solicitud.encabezados.Authorization).toMatch(/^Bearer /)
        expect(solicitud.cuerpo.nombreInvitado).toBeUndefined()
    })

    it('una cuenta interna (no cliente) no puede comprar', async () => {
        guardarSesionDePrueba({ nombre: 'Sofía Pérez', correo: 'admin@gaselvolcan.cl', rol: 'ADMINISTRADOR' })
        simular({ 'GET /usuarios/yo': () => [200, CUENTAS.admin] })
        abrir()
        await screen.findByText('Cilindro de prueba')

        expect(screen.getByText('Para comprar debes usar una cuenta de cliente.')).toBeInTheDocument()
        expect(pagar()).toBeDisabled()
    })

    it('sin stock suficiente no deja pagar', async () => {
        simular({}, { ...producto, stock: 0 })
        abrir()

        expect(await screen.findByText(/sin stock suficiente/)).toBeInTheDocument()
        expect(pagar()).toBeDisabled()
    })

    it('si el catálogo no responde, se puede reintentar', async () => {
        let falla = true
        simularApi({
            'GET /productos': () => falla ? [503, { estado: 503, mensaje: 'Catálogo apagado.' }] : [200, [producto]],
            'GET /categorias': () => [200, [categoria]]
        })
        const usuario = userEvent.setup()
        abrir()

        expect(await screen.findByText(/Catálogo apagado/)).toBeInTheDocument()
        falla = false
        await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))

        expect(await screen.findByText('Cilindro de prueba')).toBeInTheDocument()
        expect(pagar()).toBeEnabled()
    })

    it('en http (sin HTTPS, como la EC2) también compra: arma la clave sin randomUUID', async () => {
        const original = crypto.randomUUID
        // En una página http el navegador no ofrece randomUUID
        Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
        let clave
        simular({
            'POST /boletas': (cuerpo, encabezados) => {
                clave = encabezados['idempotency-key']
                return boletaCreada(cuerpo)
            }
        })
        const usuario = userEvent.setup()
        try {
            abrir()
            await screen.findByText('Cilindro de prueba')
            await completar(usuario)
            await usuario.click(pagar())

            expect(await screen.findByText('Compra realizada con éxito')).toBeInTheDocument()
            expect(clave).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
        } finally {
            Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true })
        }
    })
})
