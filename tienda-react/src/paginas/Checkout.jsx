import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import { useCarrito } from '../contexto/carritoContexto'
import { crearPedido } from '../datos/pedidos'
import { formatearPrecio, imagenDe, IMAGEN_RESPALDO } from '../datos/productos'
import { buscarUsuario } from '../datos/usuarios'
import { normalizar } from '../datos/zonas'
import {
    validarNombre,
    validarCorreo,
    validarDireccion,
    validarTelefonoObligatorio
} from '../utilidades/validaciones'
import { useCatalogo } from '../contexto/catalogoContexto'
import {
    validarNumeroTarjeta,
    validarTitular,
    validarVencimiento,
    validarCvv,
    procesarPago,
    ultimosCuatro
} from '../utilidades/pasarela'

function Checkout() {
    const navigate = useNavigate()
    const { detalle, vaciar } = useCarrito()
    const { usuario } = useSesion()
    const { descontar } = useCatalogo()

    const comunas = [
        'Chillán',
        'Chillán Viejo',
        'El Carmen',
        'Pinto',
        'San Ignacio',
        'Bulnes',
        'Quillón'
    ]

    // Si hay sesion, los datos de la cuenta se rellenan solos
    // (lo pide la Figura 6 de las instrucciones de la EP2).
    // La comuna se busca en la lista sin importar tildes ni mayusculas.
    const cuenta = usuario ? buscarUsuario(usuario.correo) : null
    const comunaCuenta = comunas.find(
        (c) => normalizar(c) === normalizar(cuenta?.comuna || '')
    )

    const [formulario, setFormulario] = useState({
        nombre: cuenta?.nombre || '',
        correo: cuenta?.correo || '',
        telefono: cuenta?.telefono || '',
        direccion: cuenta?.direccion || '',
        comuna: comunaCuenta || '',
        indicaciones: '',
        // Datos de la tarjeta: viven solo en este estado, nunca se guardan
        numeroTarjeta: '',
        titular: '',
        vencimiento: '',
        cvv: ''
    })

    // Mientras la pasarela "responde", el boton queda desactivado
    // para que un doble clic no pague dos veces
    const [procesando, setProcesando] = useState(false)

    const [errores, setErrores] = useState({})

    function manejarCambio(e) {
        const { name, value } = e.target

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }))

        setErrores((anteriores) => ({
            ...anteriores,
            [name]: ''
        }))
    }

    function usarImagenRespaldo(evento) {
        if (evento.currentTarget.src.endsWith(IMAGEN_RESPALDO)) {
            return
        }

        evento.currentTarget.src = IMAGEN_RESPALDO
    }

    function validarFormulario() {
        const nuevosErrores = {}

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

        // Datos de pago: misma idea, cada regla devuelve "" si esta bien
        const reglasPago = {
            numeroTarjeta: validarNumeroTarjeta(formulario.numeroTarjeta),
            titular: validarTitular(formulario.titular),
            vencimiento: validarVencimiento(formulario.vencimiento),
            cvv: validarCvv(formulario.cvv)
        }

        Object.keys(reglasPago).forEach((campo) => {
            if (reglasPago[campo]) {
                nuevosErrores[campo] = reglasPago[campo]
            }
        })

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }

    function confirmarCompra(e) {
        e.preventDefault()

        if (detalle.lineas.length === 0) {
            setErrores({
                carrito: 'No puedes confirmar una compra con el carrito vacío.'
            })
            return
        }

        if (!validarFormulario()) {
            return
        }

        setProcesando(true)

        // Simula el tiempo que tarda el banco en responder
        setTimeout(() => {
            const respuesta = procesarPago(formulario.numeroTarjeta)

            // Rechazado: no se crea pedido y el carrito queda intacto
            if (!respuesta.aprobado) {
                navigate('/pago-rechazado', {
                    state: { motivo: respuesta.motivo }
                })
                return
            }

            const pedido = crearPedido({
                cliente: {
                    nombre: formulario.nombre.trim(),
                    correo: formulario.correo.trim(),
                    telefono: formulario.telefono.trim()
                },
                entrega: {
                    direccion: formulario.direccion.trim(),
                    comuna: formulario.comuna,
                    indicaciones: formulario.indicaciones.trim()
                },
                productos: detalle.lineas,
                total: detalle.total,
                // De la tarjeta solo se guardan los ultimos 4 digitos
                pago: {
                    tarjeta: '•••• ' + ultimosCuatro(formulario.numeroTarjeta)
                }
            })
            descontar(detalle.lineas)
            vaciar()

            navigate('/compra-exitosa', {
                state: {
                    pedido
                }
            })
        }, 1200)
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
                                                >
                                                    <option value="">Selecciona una comuna</option>
                                                    {comunas.map((comuna) => (
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

                                {detalle.lineas.length === 0 ? (
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
                                    <strong>{formatearPrecio(detalle.total)}</strong>
                                </div>

                                {errores.carrito && (
                                    <p className="mensaje-error-campo">{errores.carrito}</p>
                                )}

                                {/* El boton esta fuera del form: "form" lo conecta igual */}
                                <button
                                    type="submit"
                                    form="formCheckout"
                                    className="btn btn-principal w-100"
                                    disabled={detalle.lineas.length === 0 || procesando}
                                >
                                    {procesando
                                        ? 'Procesando pago…'
                                        : 'Pagar ' + formatearPrecio(detalle.total)}
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
