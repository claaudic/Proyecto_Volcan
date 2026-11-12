import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSesion } from '../contexto/sesionContexto'
import { obtenerCatalogo } from '../datos/catalogoApi'
import { crearClienteCatalogoAdmin } from '../datos/catalogoAdminApi'

const VACIO = { codigo: '', nombre: '', descripcion: '', categoria: '', unidad: '',
  precioResidencial: '', precioComercial: '', stock: '', stockCritico: '', imagen: '' }
function formularioDe(p) {
  return { codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion || '', categoria: String(p.categoriaId),
    unidad: p.unidad, precioResidencial: p.precioResidencial, precioComercial: p.precioComercial,
    stock: p.stock, stockCritico: p.stockCritico ?? '', imagen: p.imagen || '' }
}

export function useAdminProductosHttp() {
  const { usuario, llamarApi } = useSesion()
  const cliente = useMemo(() => crearClienteCatalogoAdmin({ llamarApi }), [llamarApi])
  const [lectura, setLectura] = useState({ productos: [], categorias: [], cargando: true, error: '' })
  const [formulario, setFormulario] = useState(VACIO)
  const [productoEditando, setProductoEditando] = useState(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [productoABorrar, cambiarProductoABorrar] = useState(null)
  const [errores, setErrores] = useState({})
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [conflicto, setConflicto] = useState(false)
  const [revisionActual, setRevisionActual] = useState(null)
  const bloqueo = useRef(false)
  const montado = useRef(false)
  const secuencia = useRef(0)
  const identidad = JSON.stringify(usuario == null ? null : { id: usuario.id, rol: usuario.rol, correo: usuario.correo })
  const contexto = useRef({ identidad, revision: 0 })
  useLayoutEffect(() => {
    if (contexto.current.identidad !== identidad) contexto.current = { identidad, revision: contexto.current.revision + 1 }
  }, [identidad])
  useLayoutEffect(() => {
    const invalidarPendientes = () => {
      secuencia.current++
      contexto.current.revision++
    }
    montado.current = true
    return () => { montado.current = false; invalidarPendientes() }
  }, [])
  useEffect(() => {
    const numero = ++secuencia.current
    let vigente = true
    obtenerCatalogo().then(datos => {
      if (vigente && numero === secuencia.current) setLectura({ ...datos, cargando: false, error: '' })
    }).catch(e => {
      if (vigente && numero === secuencia.current) setLectura({ productos: [], categorias: [], cargando: false, error: e.message })
    })
    return () => { vigente = false }
  }, [])
  const administrador = usuario?.rol === 'ADMINISTRADOR'
  const accionesBloqueadas = enviando || lectura.cargando || Boolean(lectura.error) || conflicto || !administrador
  const productos = lectura.error ? [] : lectura.productos

  async function leer() {
    const numero = ++secuencia.current
    const revision = contexto.current.revision
    setLectura(actual => ({ ...actual, cargando: true, error: '' }))
    try {
      const datos = await obtenerCatalogo()
      if (!montado.current || numero !== secuencia.current) return null
      if (revision !== contexto.current.revision) {
        setLectura({ productos: [], categorias: [], cargando: false, error: 'La sesión cambió. Actualiza el catálogo antes de continuar.' })
        return null
      }
      setLectura({ ...datos, cargando: false, error: '' })
      return datos
    } catch (e) {
      if (montado.current && numero === secuencia.current) setLectura({ productos: [], categorias: [], cargando: false, error: e.message })
      return null
    }
  }
  async function recargar() {
    if (bloqueo.current || lectura.cargando) return
    setRevisionActual(null)
    const datos = await leer()
    if (!datos) return
    if (conflicto && (productoEditando || productoABorrar)) {
      const id = productoEditando?.id ?? productoABorrar.id
      const actual = datos.productos.find(p => p.id === id)
      if (actual) {
        setRevisionActual(actual)
        setMensaje('Datos actuales recibidos. El borrador se conserva hasta que decidas reemplazarlo.')
      } else setError('El producto ya no existe. Conserva tu borrador y cierra el formulario antes de continuar.')
    } else {
      setConflicto(false)
      setError('')
      setMensaje('Catálogo administrativo actualizado.')
    }
  }
  function aceptarRevision() {
    if (!revisionActual || bloqueo.current || lectura.cargando || lectura.error) return
    if (productoEditando) { setProductoEditando(revisionActual); setFormulario(formularioDe(revisionActual)) }
    if (productoABorrar) cambiarProductoABorrar(revisionActual)
    setRevisionActual(null); setConflicto(false); setError(''); setErrores({})
    setMensaje('Versión actual cargada. Revisa el formulario antes de guardar.')
  }
  function cambiarCampo(e) {
    if (bloqueo.current) return
    setFormulario(actual => ({ ...actual, [e.target.name]: e.target.value }))
  }
  function abrirNuevoProducto() {
    if (accionesBloqueadas || bloqueo.current) return
    setFormulario(VACIO); setProductoEditando(null); setMostrarFormulario(true); setErrores({}); setError(''); setMensaje('')
  }
  function abrirEditarProducto(p) {
    if (accionesBloqueadas || bloqueo.current) return
    setProductoEditando(p); setFormulario(formularioDe(p)); setMostrarFormulario(true); setErrores({}); setError(''); setMensaje('')
  }
  function cerrarFormulario() {
    if (bloqueo.current) return
    setMostrarFormulario(false); setProductoEditando(null); setErrores({}); setRevisionActual(null)
  }
  function setProductoABorrar(p) {
    if (bloqueo.current || (p && accionesBloqueadas)) return
    cambiarProductoABorrar(p); setError(''); setMensaje(''); setRevisionActual(null)
  }
  function validar() {
    const errores = {}
    const f = formulario
    if (f.codigo.trim().length < 3) errores.codigo = 'El código debe tener al menos 3 caracteres.'
    if (!f.nombre.trim() || f.nombre.length > 100) errores.nombre = 'Ingresa un nombre de hasta 100 caracteres.'
    if (f.descripcion.length > 255) errores.descripcion = 'La descripción no puede superar 255 caracteres.'
    if (!lectura.categorias.some(c => String(c.id) === f.categoria)) errores.categoria = 'Selecciona una categoría.'
    if (!f.unidad) errores.unidad = 'Selecciona una unidad.'
    for (const campo of ['precioResidencial', 'precioComercial']) {
      const n = Number(f[campo])
      if (f[campo] === '' || !Number.isFinite(n) || n < 0 || Math.abs(n * 100 - Math.round(n * 100)) > 0.000001) errores[campo] = 'Ingresa un precio válido, con hasta dos decimales.'
    }
    if (f.stock === '' || !Number.isInteger(Number(f.stock)) || Number(f.stock) < 0) errores.stock = 'El stock debe ser un número entero mayor o igual a 0.'
    if (f.stockCritico !== '' && (!Number.isInteger(Number(f.stockCritico)) || Number(f.stockCritico) < 0)) errores.stockCritico = 'El stock crítico debe ser un número entero mayor o igual a 0.'
    if (productos.some(p => p.codigo.toUpperCase() === f.codigo.trim().toUpperCase() && p.id !== productoEditando?.id)) errores.codigo = 'Ya existe un producto con ese código.'
    setErrores(errores)
    return Object.keys(errores).length === 0
  }
  async function ejecutar(operacion, confirmar) {
    if (bloqueo.current || accionesBloqueadas) return false
    bloqueo.current = true; setEnviando(true); setError(''); setMensaje('')
    const revision = contexto.current.revision
    try {
      await operacion()
      if (!montado.current) return false
      if (revision !== contexto.current.revision) {
        setConflicto(true); setError('La sesión cambió. Verifica el resultado y recarga antes de continuar.'); return false
      }
      confirmar?.()
      setMensaje('Operación confirmada. Actualizando catálogo…')
      const datos = await leer()
      if (!montado.current) return true
      if (revision !== contexto.current.revision) {
        setConflicto(true); setError('La sesión cambió. Recarga antes de continuar.'); return true
      }
      setMensaje(datos ? 'Operación confirmada y catálogo actualizado.'
        : 'Operación confirmada, pero no se pudo actualizar el catálogo. Actualiza la lista; no repitas la escritura.')
      return true
    } catch (e) {
      if (montado.current) {
        setError(e.message)
        if ([0, 409, 502].includes(e.estado) || revision !== contexto.current.revision) setConflicto(true)
      }
      return false
    } finally { bloqueo.current = false; if (montado.current) setEnviando(false) }
  }
  async function guardarProducto(e) {
    e.preventDefault()
    if (bloqueo.current || accionesBloqueadas || !validar()) return
    const p = productoEditando
    const cuerpo = { codigo: formulario.codigo.trim().toUpperCase(), nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(), categoriaId: Number(formulario.categoria), unidad: formulario.unidad,
      precioResidencial: Number(formulario.precioResidencial), precioComercial: Number(formulario.precioComercial),
      stock: Number(formulario.stock), stockCritico: formulario.stockCritico === '' ? null : Number(formulario.stockCritico),
      imagen: formulario.imagen.trim(), activo: p?.activo ?? true, precioOferta: p?.precioOferta ?? null,
      etiquetaOferta: p?.etiquetaOferta ?? null, ...(p ? { versionEsperada: p.version } : {}) }
    await ejecutar(() => p ? cliente.editarProducto(p.id, cuerpo) : cliente.crearProducto(cuerpo), () => {
      setMostrarFormulario(false); setProductoEditando(null); setErrores({})
    })
  }
  async function confirmarEliminar() {
    if (!productoABorrar) return
    await ejecutar(() => cliente.eliminarProducto(productoABorrar.id), () => cambiarProductoABorrar(null))
  }
  async function cambiarEstado(codigo) {
    const p = productos.find(p => p.codigo === codigo)
    if (p) await ejecutar(() => cliente.cambiarEstadoProducto(p.id, !p.activo))
  }
  return { productos, categorias: lectura.categorias, totalProductos: productos.length,
    productosActivos: productos.filter(p => p.activo).length,
    productosStockCritico: productos.filter(p => p.stockCritico !== null && p.stock <= p.stockCritico).length,
    formulario, codigoEditando: productoEditando?.codigo ?? null, mostrarFormulario, productoABorrar, errores,
    cambiarCampo, abrirNuevoProducto, abrirEditarProducto, cerrarFormulario, guardarProducto, confirmarEliminar,
    cambiarEstado, setProductoABorrar, enviando, accionesBloqueadas, cargando: lectura.cargando,
    error: error || lectura.error || (!administrador ? 'Se requiere una sesión de ADMINISTRADOR.' : ''),
    mensaje, conflicto, recargar, revisionActual, aceptarRevision }
}
