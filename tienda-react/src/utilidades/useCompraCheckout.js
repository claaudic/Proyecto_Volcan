import { useLayoutEffect, useRef, useState } from 'react'
import { prepararCompra, enviarIntentoCompra } from '../datos/boletasApi'
import { leerIntentoCompra, recuperarIntentoCompra } from '../datos/intentoCompra'

function identidadDe(usuario) {
  return usuario == null ? { tipo: 'invitado' }
    : { tipo: 'autenticado', clienteId: usuario.id, rol: usuario.rol }
}
function inspeccionar(usuario) {
  let intento
  try { intento = leerIntentoCompra() } catch {
    return { estado: 'almacenamiento-no-disponible', intento: null,
      error: 'No se puede recuperar el intento guardado. No se reemplazara automaticamente.' }
  }
  if (!intento) return { estado: 'sin-intento', intento: null, error: '' }
  try {
    return { estado: intento.estado, intento: recuperarIntentoCompra(identidadDe(usuario)), error: '' }
  } catch {
    return { estado: 'identidad-no-coincide', intento: null,
      error: 'Recupera la identidad original para continuar con este intento.' }
  }
}

// No lee catalogo, no envia desde efectos y no borra intentos. El consumidor futuro
// aportara usuario/llamarApi actuales y datos oficiales solamente al preparar.
export function useCompraCheckout({ usuario = null, llamarApi } = {}) {
  const claveIdentidad = JSON.stringify(identidadDe(usuario))
  const actual = useRef({ usuario, llamarApi, claveIdentidad, revision: 0 })
  const montado = useRef(true)
  const ocupado = useRef(false)
  const [enviando, setEnviando] = useState(false)
  const [errorOperacion, setErrorOperacion] = useState('')
  const [confirmacion, setConfirmacion] = useState(null)
  const [, actualizar] = useState(0)
  useLayoutEffect(() => {
    const revision = actual.current.revision + (actual.current.claveIdentidad === claveIdentidad ? 0 : 1)
    actual.current = { usuario, llamarApi, claveIdentidad, revision }
  }, [usuario, llamarApi, claveIdentidad])
  useLayoutEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  function preparar(datos) {
    if (!montado.current || ocupado.current) throw new Error('Hay una operacion en curso o la vista ya se cerro.')
    const vista = inspeccionar(actual.current.usuario)
    if (vista.estado !== 'sin-intento') throw new Error(vista.error || 'Ya existe un intento que debe conservarse.')
    try {
      const intento = prepararCompra({ ...datos, usuario: actual.current.usuario })
      setErrorOperacion('')
      setConfirmacion(null)
      actualizar(n => n + 1)
      return intento
    } catch (error) {
      setErrorOperacion(error.message)
      actualizar(n => n + 1)
      throw error
    }
  }

  async function enviar() {
    if (!montado.current || ocupado.current) throw new Error('Este intento ya se esta enviando o la vista se cerro.')
    const contexto = actual.current
    const intento = recuperarIntentoCompra(identidadDe(contexto.usuario))
    ocupado.current = true
    setEnviando(true)
    setErrorOperacion('')
    try {
      const boleta = await enviarIntentoCompra(intento.clave, { usuario: contexto.usuario, llamarApi: contexto.llamarApi })
      if (!montado.current || actual.current.revision !== contexto.revision) {
        throw new Error('La identidad cambio o la vista se cerro. Recupera el intento con su identidad original.')
      }
      setConfirmacion({ claveIdentidad: contexto.claveIdentidad, boleta })
      return boleta
    } catch (error) {
      if (montado.current) setErrorOperacion(actual.current.revision === contexto.revision
        ? error.message : 'La identidad cambio. El intento se conserva con su identidad original.')
      throw error
    } finally {
      ocupado.current = false
      if (montado.current) {
        setEnviando(false)
        actualizar(n => n + 1)
      }
    }
  }

  const vista = inspeccionar(usuario)
  const recuperable = Boolean(vista.intento && vista.estado !== 'confirmado')
  return {
    estado: vista.error ? vista.estado : enviando ? 'enviando' : vista.estado,
    estadoIntento: vista.intento?.estado ?? null,
    intento: vista.intento,
    boletaId: vista.intento?.boletaId ?? null,
    boleta: vista.estado === 'confirmado' && confirmacion?.claveIdentidad === claveIdentidad ? confirmacion.boleta : null,
    error: vista.error || errorOperacion,
    enviando,
    puedePreparar: !enviando && vista.estado === 'sin-intento',
    puedeEnviar: !enviando && recuperable,
    preparar, enviar,
  }
}
