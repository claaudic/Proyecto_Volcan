import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import { useCarrito } from '../contexto/carritoContexto'
import { estadoDelCarrito } from '../datos/estadoCarrito'
import { useCatalogoCheckout } from '../utilidades/useCatalogoCheckout'
import { pedir } from '../utilidades/api'
import { nuevaClaveCompra } from '../utilidades/claveCompra'
import { formatearPrecio, imagenDe } from '../datos/productos'
import { COMUNAS_COBERTURA, normalizar } from '../datos/zonas'
import { usarImagenRespaldo } from '../utilidades/imagenes'
import {
    validarNombre,
    validarCorreo,
    validarDireccion,
    validarTelefono,
    validarTelefonoObligatorio
} from '../utilidades/validaciones'
import {
    validarNumeroTarjeta,
    validarTitular,
    validarVencimiento,
    validarCvv,
    procesarPago,
    ultimosCuatro,
    formatearVencimiento,
    formatearNumeroTarjeta
} from '../utilidades/pasarela'

// Fecha local sin zona horaria, como la espera el backend (LocalDateTime)
function fechaLocal() {
    const ahora = new Date()
    const dos = (n) => String(n).padStart(2, '0')
    return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}:${dos(ahora.getSeconds())}`
}

// Sin respuesta (0) o falla del servidor (5xx): no sabemos si la boleta se creó,
// así que el reintento usa la misma clave y el backend no la duplica.
function convieneReintentar(error) {
    return !error.estado || error.estado >= 500
}

function Checkout() {
    const navigate = useNavigate()
    const { items, vaciar } = useCarrito()
    const { usuario, llamarApi } = useSesion()

    // El catálogo se vuelve a pedir al backend: precio, stock y productos activos reales
    const catalogo = useCatalogoCheckout()
    const disponibilidad = estadoDelCarrito(items, catalogo.productos, catalogo)
    const { detalle } = disponibilidad

    // Solo compran los clientes o los invitados (sin sesión)
    const puedeComprar = !usuario || usuario.rol === 'CLIENTE'

    const [formulario, setFormulario] = useState({
        nombre: usuario?.nombre || '',
        correo: usuario?.correo || '',
        telefono: '',
        direccion: '',
        comuna: '',
        indicaciones: '',
        // Datos de la tarjeta: viven solo en este estado, nunca se guardan ni se envían
        numeroTarjeta: '',
        titular: '',
        vencimiento: '',
        cvv: ''
    })
    const [errores, setErrores] = useState({})
    const [procesando, setProcesando] = useState(false)

    // Idempotency-Key de la compra en curso: se reutiliza solo si hay que reintentar
    const claveCompra = useRef(null)

    // Con sesión, se rellenan teléfono, dirección y comuna desde el perfil.
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

                // La comuna se busca en la lista sin importar tildes ni mayúsculas
                const deLaCuenta = {
                    telefono: cuenta.telefono || '',
                    direccion: cuenta.direccion || '',
                    comuna: COMUNAS_COBERTURA.find((c) => normalizar(c) === normalizar(cuenta.comuna || '')) || ''
                }

                // Solo rellena los campos vacíos, para no borrar lo que ya se escribió
                setFormulario((actual) => {
                    const relleno = { ...actual }
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
    }, [correoSesion, llamarApi])

    function manejarCambio(e) {
        const { name, value } = e.target

        // El nombre y el correo de una cuenta vienen de la sesión
        if (usuario && (name === 'nombre' || name === 'correo')) {
            return
        }

        setFormulario((anterior) => ({
            ...anterior,
            [name]: name === 'vencimiento' ? formatearVencimiento(value, anterior.vencimiento)
                : name === 'numeroTarjeta' ? formatearNumeroTarjeta(value) : value
        }))
        setErrores((anteriores) => ({ ...anteriores, [name]: '' }))
        // Si cambian los datos, la próxima compra es otra (clave nueva)
        claveCompra.current = null
    }

    function validarFormulario() {
        // Cada regla devuelve "" si está bien
        const reglas = {
            nombre: validarNombre(formulario.nombre),
            correo: validarCorreo(formulario.correo),
            // El invitado debe dejar un teléfono de contacto; en una cuenta es opcional
            telefono: usuario ? validarTelefono(formulario.telefono) : validarTelefonoObligatorio(formulario.telefono),
            direccion: validarDireccion(formulario.direccion),
            comuna: formulario.comuna === '' ? 'Selecciona una comuna.' : '',
            indicaciones: formulario.indicaciones.length > 300
                ? 'Las indicaciones no pueden superar los 300 caracteres.' : '',
            numeroTarjeta: validarNumeroTarjeta(formulario.numeroTarjeta),
            titular: validarTitular(formulario.titular),
            vencimiento: validarVencimiento(formulario.vencimiento),
            cvv: validarCvv(formulario.cvv)
        }

        const nuevosErrores = {}
        Object.keys(reglas).forEach((campo) => {
            if (reglas[campo]) {
                nuevosErrores[campo] = reglas[campo]
            }
        })

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    // Lo que se envía a POST /boletas. El total y los precios los calcula el backend.
    function armarBoleta() {
        const boleta = {
            clienteId: usuario?.id ?? null,
            direccion: formulario.direccion.trim(),
            comuna: formulario.comuna,
            estado: 'PENDIENTE',
            repartidorId: null,
            fecha: fechaLocal(),
            detalles: detalle.lineas.map((linea) => ({ productoId: linea.id, cantidad: linea.cantidad }))
        }

        if (!usuario) {
            boleta.nombreInvitado = formulario.nombre.trim()
            boleta.correoInvitado = formulario.correo.trim()
            boleta.telefonoInvitado = formulario.telefono.trim()
        }

        return boleta
    }

    async function confirmarCompra(e) {
        e.preventDefault()

        if (procesando) {
            return
        }

        if (!puedeComprar) {
            setErrores({ carrito: 'Para comprar debes usar una cuenta de cliente.' })
            return
        }

        if (!disponibilidad.puedeConfirmar) {
            setErrores({ carrito: 'Revisa tu carrito: está vacío o hay productos sin stock suficiente.' })
            return
        }

        if (!validarFormulario()) {
            return
        }

        // 1. Pago: si el banco lo rechaza, no se crea la boleta y el carrito queda intacto
        const pago = procesarPago(formulario.numeroTarjeta)

        if (!pago.aprobado) {
            navigate('/pago-rechazado', { state: { motivo: pago.motivo } })
            return
        }

        // 2. Pago aprobado: se registra la boleta en ms-pedidos (descuenta el stock)
        setProcesando(true)

        try {
            // Dentro del try: si algo falla aquí, se muestra el error y el botón se libera
            claveCompra.current = claveCompra.current || nuevaClaveCompra()
            const enviar = usuario ? llamarApi : pedir
            const boleta = await enviar('/boletas', {
                metodo: 'POST',
                cuerpo: armarBoleta(),
                encabezados: { 'Idempotency-Key': claveCompra.current }
            })

            const pedido = {
                numero: boleta.id,
                fecha: boleta.fecha,
                productos: detalle.lineas,
                total: boleta.total,
                cliente: {
                    nombre: formulario.nombre.trim(),
                    correo: formulario.correo.trim(),
                    telefono: formulario.telefono.trim()
                },
                entrega: {
                    direccion: boleta.direccion,
                    comuna: boleta.comuna,
                    indicaciones: formulario.indicaciones.trim()
                },
                // De la tarjeta solo se muestran los últimos 4 dígitos
                pago: { tarjeta: '•••• ' + ultimosCuatro(formulario.numeroTarjeta) }
            }

            claveCompra.current = null
            vaciar()
            navigate('/compra-exitosa', { state: { pedido } })
        } catch (error) {
            // Un 4xx (por ejemplo, sin stock) es definitivo: se corrige y se compra con clave nueva
            if (!convieneReintentar(error)) {
                claveCompra.current = null
            }
            setErrores({ carrito: error.message })
            setProcesando(false)
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
                value={formulario[nombre]}
                onChange={manejarCambio}
                readOnly={Boolean(usuario) && (nombre === 'nombre' || nombre === 'correo')}
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
                            ? 'Revisamos tus datos de la cuenta. Confirma la entrega y el pago.'
                            : 'Completa tus datos, la dirección de entrega y el pago.'}
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
                                            {campo('telefono', usuario ? 'Teléfono (opcional)' : 'Teléfono', entrada('telefono', { type: 'tel', autoComplete: 'tel', maxLength: 15, placeholder: '+56 9 1234 5678' }))}
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
                                                >
                                                    <option value="">Selecciona una comuna</option>
                                                    {COMUNAS_COBERTURA.map((comuna) => (
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
                                            maxLength={300}
                                            placeholder="Ej.: casa con reja verde, tocar el timbre"
                                            value={formulario.indicaciones}
                                            onChange={manejarCambio}
                                        />
                                    ))}
                                </div>

                                <div className="tarjeta-panel checkout-paso">
                                    <h2><span className="paso-numero">3</span> Pago</h2>
                                    <p className="panel-bajada">No guardamos los datos de tu tarjeta.</p>
                                    {campo('numeroTarjeta', 'Número de la tarjeta', entrada('numeroTarjeta', { inputMode: 'numeric', autoComplete: 'cc-number', maxLength: 19, placeholder: '1234 5678 9012 3456' }))}
                                    <div className="row g-3">
                                        <div className="col-sm-6">
                                            {campo('titular', 'Nombre del titular', entrada('titular', { autoComplete: 'cc-name', maxLength: 50, placeholder: 'Como aparece en la tarjeta' }))}
                                        </div>
                                        <div className="col-6 col-sm-3">
                                            {campo('vencimiento', 'Vencimiento', entrada('vencimiento', { inputMode: 'numeric', autoComplete: 'cc-exp', maxLength: 5, placeholder: 'MM/AA' }))}
                                        </div>
                                        <div className="col-6 col-sm-3">
                                            {campo('cvv', 'CVV', entrada('cvv', { inputMode: 'numeric', autoComplete: 'cc-csc', maxLength: 3, placeholder: '123' }))}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Resumen a la derecha: queda fijo al bajar la pagina */}
                        <div className="col-lg-5">
                            <aside className="tarjeta-panel checkout-lateral" aria-labelledby="titulo-resumen">
                                <h2 id="titulo-resumen">Resumen del pedido</h2>

                                {!puedeComprar && <p role="alert">Para comprar debes usar una cuenta de cliente.</p>}
                                {catalogo.cargando && <p role="status">Cargando catálogo…</p>}
                                {catalogo.error && (
                                    <div role="alert">
                                        <p>No se pudo consultar el catálogo: {catalogo.error}</p>
                                        <button type="button" className="btn btn-secundario" onClick={catalogo.recargar}>
                                            Reintentar
                                        </button>
                                    </div>
                                )}
                                {disponibilidad.estado === 'no-disponible' && (
                                    <p role="alert">Hay productos inactivos o sin stock suficiente. Revisa tu carrito.</p>
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
                                    <p className="mensaje-error-campo" role="alert">{errores.carrito}</p>
                                )}

                                {/* El boton esta fuera del form: "form" lo conecta igual */}
                                <button
                                    type="submit"
                                    form="formCheckout"
                                    className="btn btn-principal w-100"
                                    disabled={procesando || !puedeComprar || !disponibilidad.puedeConfirmar}
                                    aria-busy={procesando}
                                >
                                    {procesando ? 'Procesando pago…' : 'Pagar y confirmar'}
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
