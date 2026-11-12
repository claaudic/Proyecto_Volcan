import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import { useCarrito } from '../contexto/carritoContexto'
import { estadoDelCarrito } from '../datos/estadoCarrito'
import { useCatalogoCheckout } from '../utilidades/useCatalogoCheckout'
import { useCompraCheckout } from '../utilidades/useCompraCheckout'
import { obtenerCatalogo } from '../datos/catalogoApi'
import { formatearPrecio, imagenDe } from '../datos/productos'
import { normalizar } from '../datos/zonas'
import { usarImagenRespaldo } from '../utilidades/imagenes'
import {
    validarNombre,
    validarCorreo,
    validarDireccion,
    validarTelefonoObligatorio
} from '../utilidades/validaciones'

const COMUNAS = [
    'Chillán',
    'Chillán Viejo',
    'El Carmen',
    'Pinto',
    'San Ignacio',
    'Bulnes',
    'Quillón'
]

function Checkout() {
    const navigate = useNavigate()
    const { items, vaciar } = useCarrito()
    const { usuario, llamarApi } = useSesion()
    const catalogo = useCatalogoCheckout()
    const compra = useCompraCheckout({ usuario, llamarApi })
    const [revisionCatalogo, setRevisionCatalogo] = useState(null)
    const [comprobando, setComprobando] = useState(false)
    const bloqueo = useRef(false)
    const montado = useRef(false)
    const vigencia = useRef({ firma: '', revision: 0 })
    const catalogoActual = revisionCatalogo ?? catalogo
    const disponibilidad = estadoDelCarrito(items, catalogoActual.productos, catalogoActual)
    const { detalle } = disponibilidad
    const identidadValida = usuario == null || (Number.isSafeInteger(usuario.id) && usuario.id > 0 && usuario.rol === 'CLIENTE')
    const ocupado = comprobando || compra.enviando
    const puedeRegistrar = compra.puedePreparar && identidadValida && disponibilidad.puedeConfirmar
    const puedeActualizar = compra.puedePreparar && identidadValida && !catalogoActual.cargando
        && (Boolean(catalogoActual.error) || (items.length > 0 && !disponibilidad.puedeConfirmar))

    // Si hay sesion, los datos de la cuenta se rellenan solos
    // (lo pide la Figura 6 de las instrucciones de la EP2).
    // El nombre y el correo ya estan en la sesion; el resto se pide al backend.
    const [formulario, setFormulario] = useState({
        nombre: usuario?.nombre || '',
        correo: usuario?.correo || '',
        telefono: '',
        direccion: '',
        comuna: '',
        indicaciones: ''
    })

    const [errores, setErrores] = useState({})
    const [cuentaConfirmada, setCuentaConfirmada] = useState(null)
    const identidadCuenta = usuario ? `${usuario.id}:${usuario.correo}` : null
    const idSesion = usuario?.id
    const contactoCuenta = cuentaConfirmada?.identidad === identidadCuenta ? cuentaConfirmada : null

    const firma = JSON.stringify({ items, formulario, identidad: usuario == null ? null
        : { id: usuario.id, rol: usuario.rol, correo: usuario.correo } })
    useLayoutEffect(() => {
        if (vigencia.current.firma !== firma) {
            vigencia.current = { firma, revision: vigencia.current.revision + 1 }
        }
    }, [firma])
    useLayoutEffect(() => {
        montado.current = true
        return () => {
            montado.current = false
            vigencia.current = { ...vigencia.current, revision: vigencia.current.revision + 1 }
        }
    }, [])

    // GET /usuarios/yo: telefono, direccion y comuna guardados en el perfil.
    // Solo rellena los campos vacios, para no borrar lo que ya se escribio.
    // Si falla, no pasa nada: el cliente escribe sus datos a mano.
    const correoSesion = usuario?.correo
    useEffect(() => {
        if (!correoSesion) {
            return
        }

        let vigente = true

        llamarApi('/usuarios/yo')
            .then((cuenta) => {
                if (!vigente) {
                    return
                }

                if ((idSesion != null && cuenta.id !== idSesion) || cuenta.correo !== correoSesion) return
                const cliente = {
                    nombre: [cuenta.nombre, cuenta.apellidos].filter(Boolean).join(' '),
                    correo: cuenta.correo,
                    telefono: cuenta.telefono || ''
                }
                setCuentaConfirmada({ identidad: identidadCuenta, cliente })

                // La comuna se busca en la lista sin importar tildes ni mayusculas
                const deLaCuenta = {
                    telefono: cuenta.telefono || '',
                    direccion: cuenta.direccion || '',
                    comuna: COMUNAS.find((c) => normalizar(c) === normalizar(cuenta.comuna || '')) || ''
                }

                setFormulario((actual) => {
                    const relleno = { ...actual, ...cliente }
                    Object.keys(deLaCuenta).forEach((campo) => {
                        if (relleno[campo] === '') {
                            relleno[campo] = deLaCuenta[campo]
                        }
                    })
                    return relleno
                })
            })
            .catch(() => {})

        return () => { vigente = false }
    }, [correoSesion, llamarApi, identidadCuenta, idSesion])

    function manejarCambio(e) {
        const { name, value } = e.target
        if (name === 'indicaciones' || (usuario && ['nombre', 'correo', 'telefono'].includes(name))) return

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }))

        setErrores((anteriores) => ({
            ...anteriores,
            [name]: ''
        }))
    }

    function validarFormulario() {
        const nuevosErrores = {}

        if (usuario && !contactoCuenta) {
            nuevosErrores.carrito = 'No se pudieron comprobar los datos de tu cuenta.'
        }

        const errorNombre = validarNombre(formulario.nombre)
        const errorCorreo = validarCorreo(formulario.correo)

        if (errorNombre) {
            nuevosErrores.nombre = errorNombre
        }

        if (errorCorreo) {
            nuevosErrores.correo = errorCorreo
        }

        const errorTelefono = validarTelefonoObligatorio(formulario.telefono)

        if (errorTelefono) {
            nuevosErrores.telefono = errorTelefono
        }

        // Calle y numero: misma regla que el perfil
        const errorDireccion = validarDireccion(formulario.direccion)

        if (errorDireccion) {
            nuevosErrores.direccion = errorDireccion
        }

        if (formulario.comuna === '') {
            nuevosErrores.comuna = 'Selecciona una comuna.'
        }

        if (formulario.indicaciones.length > 300) {
            nuevosErrores.indicaciones =
                'Las indicaciones no pueden superar los 300 caracteres.'
        }

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }

    function guardarResumen(intento, productos) {
        // Datos de presentación separados del cuerpo HTTP y de su Idempotency-Key.
        // No se guardan credenciales ni información bancaria.
        const resumen = {
            clave: intento.clave,
            cuerpo: intento.cuerpo,
            items,
            cliente: usuario ? contactoCuenta.cliente : {
                nombre: intento.cuerpo.nombreInvitado,
                correo: intento.cuerpo.correoInvitado,
                telefono: intento.cuerpo.telefonoInvitado
            },
            productos: items.map(item => {
                const producto = productos.find(p => p.codigo === item.codigo)
                return { id: producto.id, codigo: producto.codigo, nombre: producto.nombre }
            })
        }
        sessionStorage.setItem('gasVolcan.resumenCheckout.v1', JSON.stringify(resumen))
        return resumen
    }

    function recuperarResumen(intento) {
        const contenido = sessionStorage.getItem('gasVolcan.resumenCheckout.v1')
        if (!contenido) return null
        const resumen = JSON.parse(contenido)
        return resumen.clave === intento.clave && JSON.stringify(resumen.cuerpo) === JSON.stringify(intento.cuerpo)
            ? resumen : null
    }

    function mostrarPedido(boleta, intento, resumen, vigente) {
        // enviar() solo devuelve una respuesta 201 cuyo cuerpo ya fue validado.
        // Una respuesta tardía no borra artículos nuevos ni cambia de pantalla.
        if (!vigente()) return
        const pedido = {
            numero: boleta.id,
            productos: boleta.detalles.map(linea => {
                const producto = resumen?.productos.find(p => p.id === linea.productoId)
                return { codigo: producto?.codigo ?? String(linea.productoId),
                    nombre: producto?.nombre ?? 'Producto', cantidad: linea.cantidad,
                    precio: linea.precio, subtotal: Math.round(linea.precio * 100) * linea.cantidad / 100 }
            }),
            total: boleta.total,
            cliente: resumen?.cliente ?? (intento.identidad.tipo === 'invitado' ? {
                nombre: intento.cuerpo.nombreInvitado, correo: intento.cuerpo.correoInvitado,
                telefono: intento.cuerpo.telefonoInvitado
            } : null),
            entrega: { direccion: boleta.direccion, comuna: boleta.comuna }
        }
        // Un intento antiguo sin resumen no demuestra qué carrito debe vaciarse.
        if (resumen && JSON.stringify(items) === JSON.stringify(resumen.items)) vaciar()
        navigate('/compra-exitosa', { state: { pedido } })
    }

    async function confirmarCompra(e) {
        e.preventDefault()
        if (bloqueo.current || ocupado || compra.estadoIntento === 'confirmado') return
        bloqueo.current = true
        const revision = vigencia.current.revision
        const vigente = () => montado.current && vigencia.current.revision === revision
        try {
            // Recuperar no reconstruye el cuerpo con los datos actuales.
            if (compra.puedeEnviar) {
                setErrores({})
                const intento = compra.intento
                const resumen = recuperarResumen(intento)
                const boleta = await compra.enviar()
                mostrarPedido(boleta, intento, resumen, vigente)
                return
            }
            if (!compra.puedePreparar) return
            if (puedeActualizar) {
                setComprobando(true)
                const actualizado = await obtenerCatalogo()
                if (vigente()) {
                    setRevisionCatalogo({ ...actualizado, cargando: false, error: '' })
                    setErrores({})
                }
                return
            }
            const valido = validarFormulario()
            if (!identidadValida || !disponibilidad.puedeConfirmar) {
                setErrores(actual => ({ ...actual, carrito: identidadValida
                    ? 'Revisa el carrito y el catálogo oficial antes de registrar.'
                    : 'Necesitas una cuenta de cliente con identidad válida.' }))
                return
            }
            if (!valido) return
            setComprobando(true)
            const actualizado = await obtenerCatalogo()
            if (!vigente()) {
                if (montado.current) setErrores({ carrito: 'Los datos cambiaron. Revisa el resumen y confirma nuevamente.' })
                return
            }
            setRevisionCatalogo({ ...actualizado, cargando: false, error: '' })
            const disponible = estadoDelCarrito(items, actualizado.productos)
            if (!disponible.puedeConfirmar) {
                setErrores({ carrito: 'El catálogo actualizado no permite registrar estos productos. Revisa disponibilidad y stock.' })
                return
            }
            const cambiaron = items.some(item => {
                const anterior = catalogoActual.productos.find(p => p.codigo === item.codigo)
                const nuevo = actualizado.productos.find(p => p.codigo === item.codigo)
                return !anterior || !nuevo || ['id', 'precioResidencial', 'precioComercial', 'precioOferta']
                    .some(campo => anterior[campo] !== nuevo[campo])
            })
            if (cambiaron) {
                setErrores({ carrito: 'Los precios o productos cambiaron. Revisa el resumen actualizado y confirma nuevamente.' })
                return
            }
            const intento = compra.preparar({ items, productos: actualizado.productos,
                entrega: { direccion: formulario.direccion.trim(), comuna: formulario.comuna },
                invitado: { nombre: formulario.nombre.trim(), correo: formulario.correo.trim(), telefono: formulario.telefono.trim() } })
            const resumen = guardarResumen(intento, actualizado.productos)
            const boleta = await compra.enviar()
            mostrarPedido(boleta, intento, resumen, vigente)
        } catch (error) {
            if (vigente()) setErrores(actual => ({ ...actual, carrito: error.message }))
        } finally {
            bloqueo.current = false
            if (montado.current) setComprobando(false)
        }
    }

    // Borde rojo solo en los campos con error
    function clase(campo) {
        return errores[campo] ? 'campo-invalido' : ''
    }

    // Un campo del formulario: etiqueta, control y mensaje de error
    function campo(nombre, etiqueta, control) {
        return (
            <div className="campo">
                <label htmlFor={nombre}>{etiqueta}</label>
                {control}
                <small className="mensaje-error-campo" role="status">
                    {errores[nombre]}
                </small>
            </div>
        )
    }

    function entrada(nombre, opciones = {}) {
        return (
            <input
                id={nombre}
                name={nombre}
                type="text"
                className={clase(nombre)}
                value={usuario && ['nombre', 'correo', 'telefono'].includes(nombre)
                    ? contactoCuenta?.cliente[nombre] ?? (nombre === 'nombre' ? usuario.nombre : nombre === 'correo' ? usuario.correo : '')
                    : formulario[nombre]}
                onChange={manejarCambio}
                disabled={!compra.puedePreparar}
                readOnly={Boolean(usuario) && ['nombre', 'correo', 'telefono'].includes(nombre)}
                {...opciones}
            />
        )
    }

    return (
        <main>
            <section className="pagina-encabezado" aria-labelledby="titulo-checkout">
                <div className="encabezado-fondo" aria-hidden="true">
                    <span className="luz luz-encabezado-verde"></span>
                    <span className="luz luz-encabezado-celeste"></span>
                    <span className="encabezado-arco"></span>
                </div>

                <div className="container">
                    <nav className="miga" aria-label="Ruta">
                        <Link to="/">Inicio</Link>
                        <span aria-hidden="true">/</span>
                        <Link to="/productos">Productos</Link>
                        <span aria-hidden="true">/</span>
                        <span aria-current="page">Finalizar compra</span>
                    </nav>
                    <h1 id="titulo-checkout">Finalizar compra</h1>
                    <p className="pagina-bajada">
                        {usuario
                            ? 'Revisamos tus datos de la cuenta. Confirma la entrega y el pedido.'
                            : 'Completa tus datos y la dirección de entrega para confirmar el pedido.'}
                    </p>
                </div>

                <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                    <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
                </svg>
            </section>

            <section className="checkout">
                <div className="container">
                    <div className="row g-4">

                        {/* Formulario a la izquierda, en tres pasos */}
                        <div className="col-lg-7">
                            <form id="formCheckout" noValidate onSubmit={confirmarCompra}>

                                <div className="tarjeta-panel checkout-paso">
                                    <h2><span className="paso-numero">1</span> Tus datos</h2>
                                    {!usuario && (
                                        <p className="panel-bajada">
                                            ¿Tienes cuenta? <Link to="/login">Inicia sesión</Link> y
                                            rellenamos tus datos.
                                        </p>
                                    )}
                                    <div className="row g-3">
                                        <div className="col-sm-6">
                                            {campo('nombre', 'Nombre', entrada('nombre', { autoComplete: 'name', maxLength: 100 }))}
                                        </div>
                                        <div className="col-sm-6">
                                            {campo('correo', 'Correo electrónico', entrada('correo', { type: 'email', autoComplete: 'email', maxLength: 100 }))}
                                        </div>
                                        <div className="col-sm-6">
                                            {campo('telefono', 'Teléfono', entrada('telefono', { type: 'tel', autoComplete: 'tel', maxLength: 15, placeholder: '+56 9 1234 5678' }))}
                                        </div>
                                    </div>
                                </div>

                                <div className="tarjeta-panel checkout-paso">
                                    <h2><span className="paso-numero">2</span> Dirección de entrega</h2>
                                    <div className="row g-3">
                                        <div className="col-sm-7">
                                            {campo('direccion', 'Dirección', entrada('direccion', { autoComplete: 'street-address', maxLength: 300, placeholder: 'Calle y número' }))}
                                        </div>
                                        <div className="col-sm-5">
                                            {campo('comuna', 'Comuna', (
                                                <select
                                                    id="comuna"
                                                    name="comuna"
                                                    className={clase('comuna')}
                                                    value={formulario.comuna}
                                                    onChange={manejarCambio}
                                                    disabled={!compra.puedePreparar}
                                                >
                                                    <option value="">Selecciona una comuna</option>
                                                    {COMUNAS.map((comuna) => (
                                                        <option key={comuna} value={comuna}>{comuna}</option>
                                                    ))}
                                                </select>
                                            ))}
                                        </div>
                                    </div>
                                    {campo('indicaciones', 'Indicaciones para la entrega (opcional)', (
                                        <textarea
                                            id="indicaciones"
                                            name="indicaciones"
                                            className={`checkout-indicaciones ${clase('indicaciones')}`}
                                            rows="3"
                                            disabled
                                            maxLength={300}
                                            placeholder="Ej.: casa con reja verde, tocar el timbre"
                                            value={formulario.indicaciones}
                                            onChange={manejarCambio}
                                        />
                                    ))}
                                </div>

                                <div className="tarjeta-panel checkout-paso">
                                    <h2><span className="paso-numero">3</span> Confirmación del pedido</h2>
                                </div>
                            </form>
                        </div>

                        {/* Resumen a la derecha: queda fijo al bajar la pagina */}
                        <div className="col-lg-5">
                            <aside className="tarjeta-panel checkout-lateral" aria-labelledby="titulo-resumen">
                                <h2 id="titulo-resumen">Resumen del pedido</h2>

                                {!identidadValida && <p role="alert">Necesitas una cuenta de cliente con identidad válida.</p>}
                                {compra.error && <p role="alert">{compra.error}</p>}
                                {catalogoActual.cargando && <p role="status">Cargando catálogo oficial…</p>}
                                {catalogoActual.error && (
                                    <div role="alert">
                                        <p>No se pudo consultar el catálogo oficial: {catalogoActual.error}</p>
                                    </div>
                                )}
                                {disponibilidad.estado === 'no-disponible' && (
                                    <p role="alert">Hay productos inválidos, inactivos o sin stock suficiente. Revisa tu carrito.</p>
                                )}

                                {items.length === 0 ? (
                                    <p className="panel-bajada">
                                        No hay productos en el carrito.{' '}
                                        <Link to="/productos">Ver el catálogo</Link>
                                    </p>
                                ) : (
                                    <ul className="checkout-lineas list-unstyled">
                                        {detalle.lineas.map((linea) => (
                                            <li key={linea.codigo} className="checkout-linea">
                                                <img src={imagenDe(linea)} alt="" onError={usarImagenRespaldo} />
                                                <div>
                                                    <strong>{linea.nombre}</strong>
                                                    <span>{linea.cantidad} × {formatearPrecio(linea.precio)}</span>
                                                </div>
                                                <strong>{formatearPrecio(linea.subtotal)}</strong>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                <div className="checkout-total">
                                    <span>Total</span>
                                    <strong>{detalle.total === null ? 'No disponible' : formatearPrecio(detalle.total)}</strong>
                                </div>

                                {errores.carrito && (
                                    <p className="mensaje-error-campo">{errores.carrito}</p>
                                )}

                                {/* El boton esta fuera del form: "form" lo conecta igual */}
                                <button
                                    type="submit"
                                    form="formCheckout"
                                    className="btn btn-principal w-100"
                                    disabled={ocupado || !(puedeRegistrar || compra.puedeEnviar || puedeActualizar)}
                                    aria-busy={ocupado}
                                >
                                    {ocupado ? 'Procesando pedido…' : compra.estadoIntento === 'confirmado'
                                        ? 'Pedido registrado' : compra.puedeEnviar ? 'Reintentar registro'
                                            : puedeActualizar ? 'Reintentar' : 'Confirmar pedido'}
                                </button>
                            </aside>
                        </div>

                    </div>
                </div>
            </section>
        </main>
    )
}

export default Checkout
