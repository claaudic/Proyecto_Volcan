import { describe, it, expect } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminProductosHttp from './AdminProductosHttp'
import ProveedorCatalogo from '../contexto/ProveedorCatalogo'
import { useCatalogo } from '../contexto/catalogoContexto'
import { SesionContexto } from '../contexto/sesionContexto'
import { pedir, API_URL } from '../utilidades/api'
import { simularApi } from '../test/api'

const categoria = { id: 71, nombre: 'Categoría API' }
const producto = { id: 901, codigo: 'CL002', nombre: 'Producto HTTP', descripcion: 'Original', categoria,
  precioResidencial: 220, precioComercial: 200, precioOferta: 190, etiquetaOferta: 'Oferta original',
  stock: 8, stockCritico: 2, activo: true, unidad: 'Unidad', imagen: '/img/http.jpg', version: 0 }
const admin = { id: 1, nombre: 'Admin', correo: 'admin@example.test', rol: 'ADMINISTRADOR' }
const llamarApi = (ruta, opciones) => pedir(ruta, { ...opciones, token: 'jwt-administrador-sintetico' })
function diferida() { let resolver; const promesa = new Promise(resolve => { resolver = resolve }); return { promesa, resolver } }
function servidor(rutas = {}) {
  let productos = [{ ...producto }]
  function respuesta(cuerpo, id, version) {
    return { ...producto, ...Object.fromEntries(Object.entries(cuerpo).filter(([k]) => !['categoriaId', 'versionEsperada'].includes(k))),
      id, version, categoria }
  }
  const api = simularApi({
    'GET /productos': () => [200, productos], 'GET /categorias': () => [200, [categoria]],
    'POST /productos': cuerpo => { const p = respuesta(cuerpo, 902, 0); productos = [...productos, p]; return [201, p] },
    'PUT /productos/901': cuerpo => { const p = respuesta(cuerpo, 901, productos[0].version + 1); productos = [p]; return [200, p] },
    'PUT /productos/901/estado': cuerpo => { productos = [{ ...productos[0], activo: cuerpo.activo, version: productos[0].version + 1 }]; return [200, productos[0]] },
    'DELETE /productos/901': () => { productos = []; return [204, null] }, ...rutas,
  })
  return { api, cambiar: p => { productos = [p] } }
}
function Publico() { const { productos } = useCatalogo(); return <output aria-label="Catálogo público local">{productos.map(p => p.nombre).join(',')}</output> }
function abrir({ usuario = admin, publico = false } = {}) {
  const vista = cuenta => <MemoryRouter><SesionContexto.Provider value={{ usuario: cuenta, llamarApi }}>
    {publico ? <ProveedorCatalogo><AdminProductosHttp /><Publico /></ProveedorCatalogo> : <AdminProductosHttp />}
  </SesionContexto.Provider></MemoryRouter>
  const resultado = render(vista(usuario))
  return { ...resultado, cambiarSesion: cuenta => resultado.rerender(vista(cuenta)) }
}
const escrituras = api => api.mock.calls.filter(([, o]) => o.method !== 'GET')
const enviar = () => fireEvent.submit(document.querySelector('.admin-producto-form'))
async function listo() { await screen.findByText('Producto HTTP'); await waitFor(() => expect(screen.getByRole('button', { name: /Crear producto/ })).toBeEnabled()) }
function llenarNuevo() {
  for (const [id, value] of [['codigoProducto', 'NUEVO'], ['nombreProducto', 'Nuevo HTTP'], ['descripcionProducto', 'Descripción'],
    ['categoriaProducto', '71'], ['unidadProducto', 'Unidad'], ['precioResidencialProducto', '330'],
    ['precioComercialProducto', '300'], ['stockProducto', '5'], ['stockCriticoProducto', '1'], ['imagenProducto', '/img/nuevo.jpg']]) {
    fireEvent.change(document.getElementById(id), { target: { value } })
  }
}
async function exito() { await screen.findByText('Operación confirmada y catálogo actualizado.') }

describe('Administración HTTP aislada', () => {
  it.each([['crear', 255], ['crear', 0], ['editar', 255], ['editar', 0]])(
    '%s acepta una descripción de %i caracteres sin recortarla', async (operacion, longitud) => {
      const { api } = servidor(); abrir(); await listo()
      fireEvent.click(screen.getByRole('button', { name: operacion === 'crear' ? /Crear producto/ : 'Editar' }))
      if (operacion === 'crear') llenarNuevo()
      const campo = document.getElementById('descripcionProducto')
      expect(campo).toHaveAttribute('maxlength', '255')
      const descripcion = 'á'.repeat(longitud)
      fireEvent.change(campo, { target: { value: descripcion } })
      enviar(); await exito()
      expect(escrituras(api)).toHaveLength(1)
      expect(JSON.parse(escrituras(api)[0][1].body).descripcion).toBe(descripcion)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    }
  )
  it.each(['crear', 'editar'])('%s rechaza 256 caracteres y conserva el borrador sin escribir', async operacion => {
    const { api } = servidor(); abrir(); await listo()
    fireEvent.click(screen.getByRole('button', { name: operacion === 'crear' ? /Crear producto/ : 'Editar' }))
    if (operacion === 'crear') llenarNuevo()
    const descripcion = 'x'.repeat(256)
    // La asignación programática comprueba la defensa aunque se eluda maxLength.
    fireEvent.change(document.getElementById('descripcionProducto'), { target: { value: descripcion } })
    const catalogo = localStorage.getItem('productosSistema')
    enviar()
    expect(screen.getByText('La descripción no puede superar 255 caracteres.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(document.getElementById('descripcionProducto')).toHaveValue(descripcion)
    expect(document.getElementById('nombreProducto')).toHaveValue(operacion === 'crear' ? 'Nuevo HTTP' : producto.nombre)
    expect(escrituras(api)).toHaveLength(0)
    expect(localStorage.getItem('productosSistema')).toBe(catalogo)
  })
  it('conserva una descripción existente de más de 255 hasta que el administrador la corrija', async () => {
    const backend = servidor()
    const descripcion = 'x'.repeat(256)
    backend.cambiar({ ...producto, descripcion })
    abrir(); await listo(); fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(document.getElementById('descripcionProducto')).toHaveValue(descripcion)
    enviar()
    expect(document.getElementById('descripcionProducto')).toHaveValue(descripcion)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(escrituras(backend.api)).toHaveLength(0)
  })
  it('mantiene la estructura original de la lista sin controles permanentes de recarga', async () => {
    const { api } = servidor(); abrir(); await listo()
    expect(screen.queryByRole('button', { name: /Actualizar catálogo|Recargar para revisar/ })).not.toBeInTheDocument()
    expect(document.querySelector('.panel-cuerpo > .container').firstElementChild).toHaveClass('panel-aviso')
    expect(screen.getAllByRole('columnheader').map(celda => celda.textContent)).toEqual([
      'Código', 'Producto', 'Categoría', 'Unidad', 'Precio residencial', 'Precio comercial', 'Stock', 'Estado', 'Acciones'
    ])
    expect(escrituras(api)).toHaveLength(0)
  })
  it.each(['crear', 'editar'])('abre el formulario de %s sin una franja adicional de actualización', async operacion => {
    const { api } = servidor(); abrir(); await listo()
    fireEvent.click(screen.getByRole('button', { name: operacion === 'crear' ? /Crear producto/ : 'Editar' }))
    const formulario = document.querySelector('.admin-producto-form')
    expect(formulario.firstElementChild.tagName).toBe('FIELDSET')
    expect(formulario.firstElementChild).toHaveStyle({ display: 'contents' })
    expect(formulario.firstElementChild.firstElementChild).toHaveClass('admin-producto-campos')
    expect(formulario.querySelector('.admin-producto-footer')).toBeInTheDocument()
    expect(screen.getByRole('dialog').querySelector('[role="status"], [role="alert"]')).toBeNull()
    expect(screen.queryByRole('button', { name: /Actualizar catálogo|Recargar para revisar/ })).not.toBeInTheDocument()
    expect(escrituras(api)).toHaveLength(0)
  })
  it('anuncia la carga inicial sin introducir un control permanente de actualización', async () => {
    const pendiente = diferida()
    const { api } = servidor({ 'GET /productos': () => pendiente.promesa })
    abrir()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando catálogo administrativo…')
    expect(screen.queryByRole('button', { name: /Actualizar catálogo|Recargar para revisar/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear producto/ })).toBeDisabled()
    await act(async () => { pendiente.resolver([200, [producto]]) })
    await listo()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(escrituras(api)).toHaveLength(0)
  })
  it('carga productos y categorías reales sin escribir al montar ni alterar el catálogo público local', async () => {
    localStorage.setItem('productosSistema', JSON.stringify([{ ...producto, nombre: 'Local intacto' }]))
    const original = localStorage.getItem('productosSistema')
    const { api } = servidor()
    abrir({ publico: true }); await listo()
    expect(escrituras(api)).toHaveLength(0)
    expect(screen.getByLabelText('Catálogo público local')).toHaveTextContent('Local intacto')
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' })); await exito()
    expect(screen.getByLabelText('Catálogo público local')).toHaveTextContent('Local intacto')
    expect(localStorage.getItem('productosSistema')).toBe(original)
  })
  it('crea con categoría real y datos válidos, luego recarga y cierra el formulario', async () => {
    const { api } = servidor(); abrir(); await listo()
    fireEvent.click(screen.getByRole('button', { name: /Crear producto/ })); llenarNuevo()
    expect(screen.getByRole('option', { name: 'Categoría API' })).toHaveValue('71')
    enviar(); await exito()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Nuevo HTTP')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Operación confirmada y catálogo actualizado.')
    expect(screen.queryByRole('button', { name: /Actualizar catálogo|Recargar para revisar/ })).not.toBeInTheDocument()
    const [url, opciones] = escrituras(api)[0]
    expect(url).toBe(API_URL + '/productos')
    expect(opciones.method).toBe('POST')
    expect(opciones.headers.Authorization).toBe('Bearer jwt-administrador-sintetico')
    expect(JSON.parse(opciones.body)).toMatchObject({ categoriaId: 71, stock: 5, activo: true, precioOferta: null })
    expect(JSON.parse(opciones.body)).not.toHaveProperty('versionEsperada')
    expect(api.mock.calls.filter(([u]) => u === API_URL + '/productos')).toHaveLength(3)
    expect(localStorage.getItem('pedidos_volcan')).toBeNull()
  })
  it.each([0, 7])('edita por ID preservando ofertas, activo y versionEsperada %s', async version => {
    const backend = servidor(); backend.cambiar({ ...producto, version, activo: false })
    abrir(); await listo(); fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(document.getElementById('nombreProducto'), { target: { value: 'Nombre editado' } })
    enviar(); await exito()
    const [url, opciones] = escrituras(backend.api)[0]
    expect(url).toBe(API_URL + '/productos/901')
    expect(JSON.parse(opciones.body)).toMatchObject({ nombre: 'Nombre editado', versionEsperada: version,
      categoriaId: 71, stock: 8, activo: false, precioOferta: 190, etiquetaOferta: 'Oferta original', imagen: '/img/http.jpg' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('elimina por ID después de confirmación, luego recarga', async () => {
    const { api } = servidor(); abrir(); await listo()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(escrituras(api)).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' })); await exito()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Producto HTTP')).not.toBeInTheDocument()
    expect(escrituras(api)[0][0]).toBe(API_URL + '/productos/901')
    expect(escrituras(api)[0][1]).toMatchObject({ method: 'DELETE', body: undefined })
  })
  it.each([true, false])('cambia estado desde activo=%s sin enviar otros campos', async activo => {
    const backend = servidor(); backend.cambiar({ ...producto, activo })
    abrir(); await listo()
    fireEvent.click(screen.getByRole('button', { name: activo ? 'Desactivar' : 'Activar' })); await exito()
    const [url, opciones] = escrituras(backend.api)[0]
    expect(url).toBe(API_URL + '/productos/901/estado')
    expect(JSON.parse(opciones.body)).toEqual({ activo: !activo })
    expect(screen.getByRole('button', { name: activo ? 'Activar' : 'Desactivar' })).toBeEnabled()
  })
  it.each([400, 401, 403, 404, 409])('HTTP %s conserva formulario y no recarga ni reintenta', async estado => {
    const { api } = servidor({ 'PUT /productos/901': () => [estado, { mensaje: 'Fallo simulado' }] })
    abrir(); await listo(); fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(document.getElementById('nombreProducto'), { target: { value: 'Mi borrador' } })
    enviar(); await screen.findByText(/Fallo simulado/)
    expect(screen.getByRole('alert')).toHaveTextContent('Fallo simulado')
    expect(screen.getByRole('button', { name: estado === 409 ? 'Recargar para revisar' : 'Actualizar catálogo' })).toBeEnabled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(document.getElementById('nombreProducto')).toHaveValue('Mi borrador')
    expect(escrituras(api)).toHaveLength(1)
    expect(api.mock.calls.filter(([u]) => u === API_URL + '/productos/901')).toHaveLength(1)
    expect(api.mock.calls.filter(([u]) => u === API_URL + '/productos')).toHaveLength(1)
    if (estado === 409) {
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
      enviar(); expect(escrituras(api)).toHaveLength(1)
    }
  })
  it('tras 409 exige recargar y reemplazar explícitamente el borrador antes de guardar con la versión nueva', async () => {
    let llamadas = 0
    const backend = servidor({ 'PUT /productos/901': cuerpo => ++llamadas === 1 ? [409, { mensaje: 'Versión obsoleta' }]
      : [200, { ...producto, nombre: cuerpo.nombre, stock: 6, version: 2 }] })
    abrir(); await listo(); fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(document.getElementById('nombreProducto'), { target: { value: 'Mi borrador' } })
    enviar(); await screen.findByText(/Versión obsoleta/)
    backend.cambiar({ ...producto, nombre: 'Actual del servidor', stock: 6, version: 1 })
    fireEvent.click(screen.getByRole('button', { name: 'Recargar para revisar' }))
    await screen.findByText(/Versión actual: 1. Stock actual: 6/)
    expect(document.getElementById('nombreProducto')).toHaveValue('Mi borrador')
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Reemplazar borrador con versión actual' }))
    expect(document.getElementById('nombreProducto')).toHaveValue('Actual del servidor')
    expect(document.getElementById('stockProducto')).toHaveValue(6)
    expect(screen.queryByRole('button', { name: /Actualizar catálogo|Recargar para revisar/ })).not.toBeInTheDocument()
    enviar(); await exito()
    expect(JSON.parse(escrituras(backend.api)[1][1].body)).toMatchObject({ versionEsperada: 1, stock: 6 })
  })
  it.each(['crear', 'editar', 'eliminar', 'estado'])('bloquea doble envío durante %s', async operacion => {
    const pendiente = diferida()
    let cuerpo
    const metodo = operacion === 'crear' ? 'POST /productos' : operacion === 'editar' ? 'PUT /productos/901'
      : operacion === 'eliminar' ? 'DELETE /productos/901' : 'PUT /productos/901/estado'
    const { api } = servidor({ [metodo]: c => { cuerpo = c; return pendiente.promesa } })
    abrir(); await listo()
    if (operacion === 'crear') { fireEvent.click(screen.getByRole('button', { name: /Crear producto/ })); llenarNuevo() }
    if (operacion === 'editar') fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    if (operacion === 'eliminar') fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    const accion = () => operacion === 'crear' || operacion === 'editar' ? enviar()
      : fireEvent.click(screen.getByRole('button', { name: operacion === 'eliminar' ? 'Sí, eliminar' : 'Desactivar' }))
    act(() => { accion(); accion() })
    await waitFor(() => expect(escrituras(api)).toHaveLength(1))
    expect(screen.getByText('Operación administrativa en curso…')).toBeInTheDocument()
    if (operacion === 'editar' || operacion === 'crear') expect(document.getElementById('nombreProducto')).toBeDisabled()
    await act(async () => { pendiente.resolver(operacion === 'eliminar' ? [204, null]
      : [operacion === 'crear' ? 201 : 200, { ...producto, ...cuerpo, id: operacion === 'crear' ? 902 : 901, version: 1 }]) })
    await exito(); expect(escrituras(api)).toHaveLength(1)
  })
  it('un éxito con fallo de recarga no se presenta como fallo de escritura', async () => {
    let numero = 0
    const { api } = servidor({ 'GET /productos': () => ++numero === 1 ? [200, [producto]] : [503, { mensaje: 'Fallo de lista' }] })
    abrir(); await listo(); fireEvent.click(screen.getByRole('button', { name: 'Editar' })); enviar()
    await screen.findByText(/Operación confirmada, pero no se pudo actualizar/)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(escrituras(api)).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar catálogo' }))
    await waitFor(() => expect(numero).toBe(3))
    expect(escrituras(api)).toHaveLength(1)
  })
  it.each(['eliminar', 'estado'])('fallo de %s conserva el producto y su confirmación', async operacion => {
    const ruta = operacion === 'eliminar' ? 'DELETE /productos/901' : 'PUT /productos/901/estado'
    const { api } = servidor({ [ruta]: () => [400, { mensaje: 'No permitido' }] })
    abrir(); await listo()
    fireEvent.click(screen.getByRole('button', { name: operacion === 'eliminar' ? 'Eliminar' : 'Desactivar' }))
    if (operacion === 'eliminar') fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    await screen.findByText('No permitido')
    expect(screen.getAllByText('Producto HTTP').length).toBeGreaterThan(0)
    if (operacion === 'eliminar') expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(escrituras(api)).toHaveLength(1)
  })
  it('no puede enviar con una sesión sin permisos aunque invoque submit', async () => {
    const { api } = servidor(); const vista = abrir(); await listo()
    fireEvent.click(screen.getByRole('button', { name: /Crear producto/ })); llenarNuevo()
    vista.cambiarSesion({ ...admin, rol: 'CLIENTE' }); enviar()
    expect(escrituras(api)).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Agregar producto' })).toBeDisabled()
  })
  it('rechaza formulario inválido sin HTTP y conserva los controles originales', async () => {
    const { api } = servidor(); abrir(); await listo()
    fireEvent.click(screen.getByRole('button', { name: /Crear producto/ })); enviar()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(document.querySelector('.admin-producto-modal')).not.toBeNull()
    expect(document.querySelector('.modal-backdrop')).not.toBeNull()
    expect(screen.getByText('Selecciona una categoría.', { selector: '.text-danger' })).toBeInTheDocument()
    expect(escrituras(api)).toHaveLength(0)
  })
  it('no confirma respuestas incompletas y conserva el formulario bloqueado para revisión', async () => {
    const { api } = servidor({ 'POST /productos': () => [201, { id: 902 }] })
    abrir(); await listo(); fireEvent.click(screen.getByRole('button', { name: /Crear producto/ })); llenarNuevo(); enviar()
    await screen.findByText(/incompleta o inconsistente/)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(document.getElementById('nombreProducto')).toHaveValue('Nuevo HTTP')
    expect(screen.getByRole('button', { name: 'Agregar producto' })).toBeDisabled()
    expect(escrituras(api)).toHaveLength(1)
  })
  it('permite reintentar una lectura fallida sin habilitar escrituras con datos locales', async () => {
    let falla = true
    const { api } = servidor({ 'GET /productos': () => falla ? [503, { mensaje: 'Catálogo no disponible' }] : [200, [producto]] })
    abrir(); await screen.findByText('Catálogo no disponible')
    expect(screen.getByRole('alert')).toHaveTextContent('Catálogo no disponible')
    expect(screen.getByRole('button', { name: /Crear producto/ })).toBeDisabled()
    falla = false
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar catálogo' })); await listo()
    expect(screen.queryByRole('button', { name: /Actualizar catálogo|Recargar para revisar/ })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Catálogo administrativo actualizado.')
    expect(escrituras(api)).toHaveLength(0)
  })
  it('un cambio de sesión durante la recarga no deja la pantalla bloqueada permanentemente', async () => {
    const pendiente = diferida()
    let llamadas = 0
    servidor({ 'GET /productos': () => ++llamadas === 1 ? [200, [producto]] : pendiente.promesa })
    const vista = abrir(); await listo(); fireEvent.click(screen.getByRole('button', { name: 'Editar' })); enviar()
    await waitFor(() => expect(llamadas).toBe(2))
    vista.cambiarSesion({ ...admin, id: 2, correo: 'otro@example.test' })
    await act(async () => { pendiente.resolver([200, [{ ...producto, version: 1 }]]) })
    await screen.findByText(/La sesión cambió/)
    expect(screen.getByRole('button', { name: 'Recargar para revisar' })).toBeEnabled()
  })
})
