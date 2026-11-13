import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import AdminOrdenes from './AdminOrdenes'
import AdminDashboard from './AdminDashboard'
import Repartidor from './Repartidor'
import { abrirPedidos, gestionDe } from '../test/pedidosHttp'
import { pedidoDeEjemplo, ADMIN } from '../test/renderizar'

const pedidos = [pedidoDeEjemplo()]
const fila = n => screen.getAllByRole('row').find(f => f.textContent.includes('#' + n))
const diferida = () => { let resolver; const promesa = new Promise(r => { resolver = r }); return { promesa, resolver } }
async function editar() {
  fireEvent.click(within(fila(1)).getByRole('button', { name: /Editar/ }))
  fireEvent.change(screen.getByLabelText('Repartidor'), { target: { value: '3' } })
}

describe('Pedidos HTTP: seguridad y recuperación sin rediseño', () => {
  it('no envía al montar, ignora el almacenamiento local y conserva las nueve columnas y botones originales', async () => {
    const leer = vi.spyOn(Storage.prototype, 'getItem')
    const vista = await abrirPedidos(<AdminOrdenes />, { pedidos, locales: [pedidoDeEjemplo({ numero: 999 })] })
    expect(vista.escrituras()).toHaveLength(0)
    expect(screen.queryByText('#999')).not.toBeInTheDocument()
    expect(leer.mock.calls.some(([k]) => k === 'pedidos_volcan')).toBe(false)
    expect(screen.getAllByRole('columnheader')).toHaveLength(9)
    expect(screen.getAllByRole('button').map(b => b.textContent.trim())).toEqual(['Ver boleta', 'Editar', 'Anular'])
    expect(document.querySelector('.tabla-marco.table-responsive .tabla-panel')).not.toBeNull()
  })
  it('bloquea anular pedidos en reparto, entregados y cancelados', async () => {
    await abrirPedidos(<AdminOrdenes />, { pedidos: ['En camino', 'Entregado', 'Cancelado'].map((estado, i) => pedidoDeEjemplo({ numero: i + 1, estado })) })
    for (const n of [1, 2, 3]) expect(within(fila(n)).getByRole('button', { name: /Anular/ })).toBeDisabled()
  })
  it('un doble submit bloquea inmediatamente la consulta y el PUT', async () => {
    const respuesta = diferida()
    const g = gestionDe(pedidos[0])
    const vista = await abrirPedidos(<AdminOrdenes />, { pedidos,
      rutas: { 'PUT /boletas/1/repartidor': () => respuesta.promesa } })
    await editar()
    const formulario = screen.getByRole('dialog').querySelector('form')
    act(() => { fireEvent.submit(formulario); fireEvent.submit(formulario) })
    await waitFor(() => expect(vista.escrituras()).toHaveLength(1))
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
    fireEvent.submit(formulario)
    expect(vista.escrituras()).toHaveLength(1)
    await act(async () => { respuesta.resolver([200, { boleta: { ...g.boleta, repartidorId: 3 }, version: 1 }]) })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
  it.each([400, 401, 403, 404, 409, 503])('HTTP %s conserva formulario y selección sin repetir la escritura', async estado => {
    const vista = await abrirPedidos(<AdminOrdenes />, { pedidos,
      rutas: { 'PUT /boletas/1/repartidor': () => [estado, { mensaje: 'Fallo de prueba' }] } })
    await editar(); fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    await screen.findByText('Fallo de prueba')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Repartidor')).toHaveValue('3')
    expect(vista.escrituras()).toHaveLength(1)
  })
  it('409 por versión obsoleta no envía y exige revisar el pedido actual', async () => {
    const vista = await abrirPedidos(<AdminOrdenes />, { pedidos })
    await editar(); vista.gestiones[0].version = 1
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    await screen.findByText(/El pedido cambio/)
    expect(vista.escrituras()).toHaveLength(0)
    expect(screen.getByLabelText('Repartidor')).toHaveValue('3')
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })
  it('un éxito con fallo de recarga no repite PUT y conserva la respuesta confirmada', async () => {
    let consultas = 0, vista
    const inicial = gestionDe(pedidos[0])
    vista = await abrirPedidos(<AdminOrdenes />, { pedidos,
      rutas: { 'GET /boletas/gestion': () => ++consultas === 2 ? [503, { mensaje: 'Recarga fallida' }]
        : [200, vista ? vista.gestiones : [inicial]] } })
    await editar(); fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    await screen.findByText('Recarga fallida')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fila(1)).toHaveTextContent('Matías Vera')
    expect(vista.escrituras()).toHaveLength(1)
    fireEvent(window, new Event('focus'))
    await waitFor(() => expect(screen.queryByText('Recarga fallida')).not.toBeInTheDocument())
    expect(vista.escrituras()).toHaveLength(1)
  })
  it('un fallo del segundo PUT conserva la asignación confirmada y bloquea reenviar el formulario obsoleto', async () => {
    const vista = await abrirPedidos(<AdminOrdenes />, { pedidos,
      rutas: { 'PUT /boletas/1/estado': () => [503, { mensaje: 'Estado no guardado' }] } })
    await editar(); fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'En camino' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    await screen.findByText('Estado no guardado')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled())
    expect(screen.getByLabelText('Estado')).toHaveValue('En camino')
    expect(vista.gestiones[0]).toMatchObject({ version: 1, boleta: { repartidorId: 3, estado: 'PENDIENTE' } })
    expect(vista.escrituras()).toHaveLength(2)
    fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    expect(vista.escrituras()).toHaveLength(2)
  })
  it.each(['identidad', 'ida-vuelta', 'desmontaje'])('no escribe si cambia %s durante la consulta previa', async cambio => {
    const pendiente = diferida()
    const vista = await abrirPedidos(<AdminOrdenes />, { usuario: { ...ADMIN, id: 1 }, pedidos,
      rutas: { 'GET /boletas/1/gestion': () => pendiente.promesa } })
    await editar(); fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    if (cambio === 'desmontaje') vista.unmount()
    else {
      vista.cambiar({ ...ADMIN, id: 99, correo: 'otra@example.test' })
      if (cambio === 'ida-vuelta') vista.cambiar({ ...ADMIN, id: 1 })
    }
    await act(async () => { pendiente.resolver([200, gestionDe(pedidos[0])]) })
    expect(vista.escrituras()).toHaveLength(0)
  })
  it.each(['identidad', 'desmontaje'])('ignora la confirmación tardía tras %s durante PUT', async cambio => {
    const pendiente = diferida()
    const vista = await abrirPedidos(<AdminOrdenes />, { usuario: { ...ADMIN, id: 1 }, pedidos,
      rutas: { 'PUT /boletas/1/repartidor': () => pendiente.promesa } })
    await editar(); fireEvent.submit(screen.getByRole('dialog').querySelector('form'))
    await waitFor(() => expect(vista.escrituras()).toHaveLength(1))
    if (cambio === 'desmontaje') vista.unmount()
    else vista.cambiar({ ...ADMIN, id: 99, correo: 'otra@example.test' })
    await act(async () => { pendiente.resolver([200, { boleta: { ...gestionDe(pedidos[0]).boleta, repartidorId: 3 }, version: 1 }]) })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(vista.escrituras()).toHaveLength(1)
  })
  it('un error inicial no presenta pedidos locales ni un vacío confirmado', async () => {
    const vista = await abrirPedidos(<AdminOrdenes />, { pedidos, rutas: { 'GET /boletas/gestion': () => [503, { mensaje: 'Pedidos no disponibles' }] } })
    expect(screen.getByRole('alert')).toHaveTextContent('Pedidos no disponibles')
    expect(screen.queryByText('#1')).not.toBeInTheDocument()
    expect(screen.queryByText('Todavía no hay pedidos registrados.')).not.toBeInTheDocument()
    expect(vista.escrituras()).toHaveLength(0)
  })
  it('Dashboard no muestra ceros de éxito durante carga ni tras un fallo', async () => {
    const pendiente = diferida()
    await abrirPedidos(<AdminDashboard />, { pedidos, esperar: false,
      rutas: { 'GET /boletas/gestion': () => pendiente.promesa } })
    expect(screen.getByText('Pedidos pendientes').nextElementSibling).toHaveTextContent('—')
    await act(async () => { pendiente.resolver([503, { mensaje: 'Pedidos no disponibles' }]) })
    expect(screen.getByText('Pedidos pendientes').nextElementSibling).toHaveTextContent('—')
    expect(screen.queryByText(/Todavía no hay pedidos/)).not.toBeInTheDocument()
  })
  it('rechaza datos de otro repartidor aunque el servidor los devolviera', async () => {
    const vista = await abrirPedidos(<Repartidor />, { usuario: { id: 3, rol: 'REPARTIDOR', correo: 'repartidor@gaselvolcan.cl' },
      pedidos, rutas: { 'GET /boletas/gestion': () => [200, [gestionDe(pedidoDeEjemplo({ repartidor: 'repartidor2@gaselvolcan.cl' }))]] } })
    expect(screen.queryByText('#1')).not.toBeInTheDocument()
    expect(vista.escrituras()).toHaveLength(0)
  })
})
