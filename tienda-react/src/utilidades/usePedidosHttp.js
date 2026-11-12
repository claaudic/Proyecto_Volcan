import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSesion } from '../contexto/sesionContexto'
import { ErrorApi } from './api'
import { obtenerPedidos, consultarGestion, aplicarRespuesta, asignarRepartidor, cambiarEstado } from '../datos/pedidosGestionApi'

const conflicto = () => new ErrorApi(409, 'El pedido cambio. Consulta su version actual antes de modificarlo.')

export function usePedidosHttp() {
  const { usuario, llamarApi } = useSesion()
  const identidad = JSON.stringify([usuario?.id, usuario?.correo, usuario?.rol])
  const actual = useRef({ identidad, usuario, llamarApi, revision: 0 })
  const montado = useRef(false)
  const lecturas = useRef(0)
  const pendiente = useRef(null)
  const [version, setVersion] = useState(0)
  const clave = identidad + ':' + version
  const [respuesta, setRespuesta] = useState({ clave: '', identidad: '', pedidos: [], productos: [], error: '' })
  const [operacion, setOperacion] = useState({ identidad: '', ocupado: false, error: '', requiereLectura: false })
  useLayoutEffect(() => {
    if (actual.current.identidad !== identidad) {
      pendiente.current = null
      lecturas.current++
    }
    actual.current = { identidad, usuario, llamarApi,
      revision: actual.current.revision + (actual.current.identidad === identidad ? 0 : 1) }
  }, [identidad, usuario, llamarApi])
  useLayoutEffect(() => {
    montado.current = true
    const secuencia = lecturas
    const contexto = actual
    return () => { montado.current = false; secuencia.current++; contexto.current.revision++ }
  }, [])

  function filtrar(pedidos, cuenta) {
    if (!cuenta || !['ADMINISTRADOR', 'DESPACHADORA', 'REPARTIDOR'].includes(cuenta.rol)) throw new ErrorApi(403, 'No tienes permiso para realizar esta acción.')
    if (cuenta.rol === 'REPARTIDOR' && (!Number.isSafeInteger(cuenta.id) || cuenta.id <= 0
        || pedidos.some(p => p.repartidor !== String(cuenta.id)))) throw new ErrorApi(403, 'Solo puedes ver tus pedidos.')
    return pedidos
  }

  useEffect(() => {
    const contexto = actual.current
    const secuencia = ++lecturas.current
    let vigente = true
    Promise.resolve().then(() => obtenerPedidos(contexto.llamarApi)).then(datos => {
      if (!vigente || !montado.current || lecturas.current !== secuencia || actual.current.revision !== contexto.revision) return
      setRespuesta({ clave, identidad, pedidos: filtrar(datos.pedidos, contexto.usuario), productos: datos.productos, error: '' })
      setOperacion(o => o.identidad === identidad ? { ...o, error: '', requiereLectura: false } : o)
    }).catch(error => {
      if (vigente && montado.current && lecturas.current === secuencia && actual.current.revision === contexto.revision)
        setRespuesta({ clave, identidad, pedidos: [], productos: [], error: error.message })
    })
    return () => { vigente = false }
  }, [clave, identidad, llamarApi])

  const recargar = useCallback(() => {
    if (!pendiente.current) setVersion(n => n + 1)
  }, [])
  useEffect(() => {
    window.addEventListener('focus', recargar)
    return () => window.removeEventListener('focus', recargar)
  }, [recargar])

  const pedidos = respuesta.identidad === identidad ? respuesta.pedidos : []
  const cargando = respuesta.clave !== clave
  const ocupado = operacion.identidad === identidad && operacion.ocupado
  const error = respuesta.identidad === identidad && respuesta.clave === clave ? respuesta.error : ''
  const errorOperacion = operacion.identidad === identidad ? operacion.error : ''
  const bloqueado = cargando || Boolean(error) || (operacion.identidad === identidad && operacion.requiereLectura)
  const obsoleto = pedido => bloqueado || !pedidos.some(p => p.numero === pedido.numero && p.version === pedido.version)

  async function guardar(pedido, cambios = {}, anular = false) {
    if (pendiente.current || obsoleto(pedido)) return { ok: false }
    if (anular && pedido.estado !== 'Pendiente') return { ok: false }
    const contexto = actual.current
    if (!['ADMINISTRADOR', 'DESPACHADORA', 'REPARTIDOR'].includes(contexto.usuario?.rol)
        || (anular && contexto.usuario.rol !== 'ADMINISTRADOR')
        || (contexto.usuario.rol === 'REPARTIDOR' && (pedido.repartidor !== String(contexto.usuario.id)
          || Object.hasOwn(cambios, 'repartidor') || !['En camino', 'Entregado'].includes(cambios.estado)))) return { ok: false }
    const dueno = Symbol()
    pendiente.current = dueno
    lecturas.current++
    const vigente = () => montado.current && actual.current.revision === contexto.revision && pendiente.current === dueno
    setOperacion({ identidad, ocupado: true, error: '', requiereLectura: false })
    let confirmado = false
    try {
      const g = await consultarGestion(contexto.llamarApi, pedido.numero)
      if (!vigente()) return { ok: false }
      if (g.version !== pedido.version) throw conflicto()
      let actualPedido = aplicarRespuesta(pedido, g.boleta, g.version)
      if (Object.hasOwn(cambios, 'repartidor') && cambios.repartidor !== actualPedido.repartidor) {
        if (contexto.usuario.rol === 'REPARTIDOR' || actualPedido.estado !== 'Pendiente') throw conflicto()
        const repartidor = cambios.repartidor === '' ? null : Number(cambios.repartidor)
        actualPedido = await asignarRepartidor(contexto.llamarApi, actualPedido, repartidor)
        if (!vigente()) return { ok: false }
      }
      const destino = anular ? 'Cancelado' : cambios.estado
      if (destino && destino !== actualPedido.estado) {
        actualPedido = await cambiarEstado(contexto.llamarApi, actualPedido, destino, anular)
        if (!vigente()) return { ok: false }
      }
      confirmado = true
      setRespuesta(r => ({ ...r, pedidos: r.pedidos.map(p => p.numero === pedido.numero ? actualPedido : p) }))
      const datos = await obtenerPedidos(contexto.llamarApi)
      if (!vigente()) return { ok: false }
      setRespuesta({ clave, identidad, pedidos: filtrar(datos.pedidos, contexto.usuario), productos: datos.productos, error: '' })
      return { ok: true }
    } catch (error) {
      if (!vigente()) return { ok: false }
      setOperacion({ identidad, ocupado: false, error: error.message, requiereLectura: true })
      if (!confirmado) {
        try {
          const datos = await obtenerPedidos(contexto.llamarApi)
          if (vigente()) {
            setRespuesta({ clave, identidad, pedidos: filtrar(datos.pedidos, contexto.usuario), productos: datos.productos, error: '' })
            setOperacion(o => ({ ...o, requiereLectura: false }))
          }
        } catch { /* Solo lectura: ninguna escritura se repite automáticamente. */ }
      }
      return { ok: confirmado, recargaFallida: confirmado }
    } finally {
      if (pendiente.current === dueno) {
        pendiente.current = null
        if (montado.current) setOperacion(o => ({ ...o, ocupado: false }))
      }
    }
  }
  return { pedidos, productos: respuesta.identidad === identidad ? respuesta.productos : [],
    identidad, cargando, ocupado, error: error || errorOperacion, obsoleto, recargar,
    guardar, anular: pedido => guardar(pedido, {}, true) }
}
