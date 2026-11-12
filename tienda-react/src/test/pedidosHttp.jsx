import { render, waitFor, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SesionContexto } from '../contexto/sesionContexto'
import { CatalogoContexto } from '../contexto/catalogoContexto'
import { adaptarCatalogo } from '../datos/adaptadorCatalogo'
import { pedir } from '../utilidades/api'
import { CUENTAS, simularApi } from './api'
import { PRODUCTOS_HTTP, CATEGORIAS_HTTP } from './catalogoHttp'

const API_ESTADOS = { Pendiente: 'PENDIENTE', 'En camino': 'EN_CAMINO', Entregado: 'ENTREGADO', Cancelado: 'CANCELADO' }
const copia = dato => JSON.parse(JSON.stringify(dato))
const llamarApi = (ruta, opciones) => pedir(ruta, { ...opciones, token: 'jwt-sintetico-pruebas' })
const catalogo = adaptarCatalogo(PRODUCTOS_HTTP, CATEGORIAS_HTTP)
const usuarios = Object.values(CUENTAS)
const idRepartidor = valor => valor ? usuarios.find(u => u.correo === valor)?.id ?? Number(valor) : null

export function gestionDe(p) {
  const lineas = p.productos ?? (p.producto ? [{ codigo: 'CL002', cantidad: p.cantidad || 1 }] : [{ codigo: 'NO-EXISTE', cantidad: 1 }])
  const detalles = lineas.map((linea, i) => ({ id: p.numero * 100 + i + 1,
    productoId: PRODUCTOS_HTTP.find(producto => producto.codigo === linea.codigo)?.id ?? 99999,
    cantidad: linea.cantidad, precio: lineas.length === 1 ? (p.total ?? 0) / linea.cantidad : linea.precio }))
  const cliente = typeof p.cliente === 'object' ? p.cliente : { nombre: p.cliente, correo: p.correo }
  const boleta = { id: p.numero, clienteId: 5, direccion: p.entrega?.direccion ?? p.direccion ?? '',
    comuna: p.entrega?.comuna ?? p.comuna ?? '', estado: API_ESTADOS[p.estado], repartidorId: idRepartidor(p.repartidor),
    fecha: p.fecha ?? '2026-01-01T12:00:00', total: p.total ?? 0, detalles }
  return { boleta, version: p.version ?? 0,
    cliente: { nombre: cliente?.nombre ?? null, correo: cliente?.correo ?? null, telefono: cliente?.telefono ?? null },
    entrega: { direccion: boleta.direccion, comuna: boleta.comuna } }
}

export async function abrirPedidos(elemento, opciones = {}) {
  let cuenta = opciones.usuario ?? CUENTAS.admin
  cuenta = { ...cuenta, id: cuenta.id ?? usuarios.find(u => u.correo === cuenta.correo)?.id }
  const gestiones = (opciones.pedidos ?? []).map(gestionDe)
  const rutas = {
    'GET /productos': () => [200, PRODUCTOS_HTTP], 'GET /categorias': () => [200, CATEGORIAS_HTTP],
    'GET /usuarios/repartidores': () => [200, usuarios.filter(u => u.rol === 'REPARTIDOR')],
    'GET /boletas/gestion': () => [200, copia(cuenta?.rol === 'REPARTIDOR'
      ? gestiones.filter(g => g.boleta.repartidorId === cuenta.id) : gestiones)],
  }
  for (const g of gestiones) {
    const ruta = `/boletas/${g.boleta.id}`
    rutas[`GET ${ruta}/gestion`] = () => [200, copia(g)]
    rutas[`PUT ${ruta}/repartidor`] = cuerpo => {
      if (cuerpo.versionEsperada !== g.version) return [409, { mensaje: 'El pedido cambio. Consulta su version actual antes de modificarlo.' }]
      if (g.boleta.estado !== 'PENDIENTE') return [409, { mensaje: 'Solo se puede cambiar el repartidor de un pedido pendiente.' }]
      g.boleta.repartidorId = cuerpo.repartidorId; g.version++
      return [200, copia({ boleta: g.boleta, version: g.version })]
    }
    rutas[`PUT ${ruta}/estado`] = cuerpo => {
      // Igual que el backend: /estado no cancela, para eso esta /anulacion
      const destinos = { PENDIENTE: ['EN_CAMINO'], EN_CAMINO: ['ENTREGADO'], ENTREGADO: [], CANCELADO: [] }
      if (!destinos[g.boleta.estado].includes(cuerpo.estado)) return [400, { mensaje: 'Transicion de estado no permitida.' }]
      g.boleta.estado = cuerpo.estado; g.version++
      return [200, copia(g.boleta)]
    }
    rutas[`PUT ${ruta}/anulacion`] = cuerpo => {
      if (g.boleta.estado === 'CANCELADO') return [200, copia({ boleta: g.boleta, version: g.version })]
      if (g.boleta.estado !== 'PENDIENTE' || cuerpo.versionEsperada !== g.version) return [409, { mensaje: 'Solo se puede anular un pedido pendiente.' }]
      g.boleta.estado = 'CANCELADO'; g.version++
      return [200, copia({ boleta: g.boleta, version: g.version })]
    }
  }
  const api = simularApi({ ...rutas, ...opciones.rutas })
  localStorage.setItem('pedidos_volcan', JSON.stringify(opciones.locales ?? opciones.pedidos ?? []))
  const vista = () => <MemoryRouter><SesionContexto.Provider value={{ usuario: cuenta, llamarApi }}>
    <CatalogoContexto.Provider value={{ ...catalogo, cargando: false, error: '' }}>{elemento}</CatalogoContexto.Provider>
  </SesionContexto.Provider></MemoryRouter>
  const resultado = render(vista())
  if (opciones.esperar !== false) await waitFor(() => {
    if (screen.queryByText('…')) throw new Error('Esperando consulta simulada')
  })
  return { ...resultado, api, gestiones,
    escrituras: () => api.mock.calls.filter(([, o]) => o.method !== 'GET'),
    cambiar: usuario => { cuenta = usuario; resultado.rerender(vista()) } }
}
