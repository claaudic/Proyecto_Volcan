import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import { useCarrito } from '../contexto/carritoContexto'
import { crearPedido } from '../datos/pedidos'
import { formatearPrecio } from '../datos/productos'
import { validarNombre, validarCorreo } from '../utilidades/validaciones'

function Checkout() {
    const navigate = useNavigate()
    const { detalle, vaciar } = useCarrito()
    const { usuario } = useSesion()

    const [formulario, setFormulario] = useState({
        nombre: usuario?.nombre || '',
        correo: usuario?.correo || '',
        direccion: '',
        comuna: '',
        indicaciones: ''
    })

    const [errores, setErrores] = useState({})

    const comunas = [
        'Chillán',
        'Chillán Viejo',
        'El Carmen',
        'Pinto',
        'San Ignacio',
        'Bulnes',
        'Quillón'
    ]

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

        if (formulario.direccion.trim() === '') {
            nuevosErrores.direccion = 'Ingresa una dirección de entrega.'
        } else if (formulario.direccion.trim().length > 300) {
            nuevosErrores.direccion =
                'La dirección no puede superar los 300 caracteres.'
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

        const pedido = crearPedido({
            cliente: {
                nombre: formulario.nombre.trim(),
                correo: formulario.correo.trim()
            },
            entrega: {
                direccion: formulario.direccion.trim(),
                comuna: formulario.comuna,
                indicaciones: formulario.indicaciones.trim()
            },
            productos: detalle.lineas,
            total: detalle.total
        })

        vaciar()

        navigate('/compra-exitosa', {
            state: {
                pedido
            }
        })
    }

    return (
        <main className="container py-5">
            <section className="checkout-intro">
                <h1 className="titulo-seccion">Finalizar compra</h1>
                <p className="text-muted">
                    Revisa tu pedido y completa los datos para la entrega.
                </p>
            </section>

            <div className="row g-5">
                <div className="col-lg-5">
                    <section className="checkout-resumen">
                        <h2 className="h4">Resumen del pedido</h2>

                        {detalle.lineas.length === 0 ? (
                            <p className="text-muted">
                                No hay productos en el carrito.
                            </p>
                        ) : (
                            <>
                                {detalle.lineas.map((linea) => (
                                    <div
                                        key={linea.codigo}
                                        className="checkout-producto"
                                    >
                                        <div className="d-flex justify-content-between gap-3">
                                            <div>
                                                <strong>{linea.nombre}</strong>

                                                <div className="text-muted small mt-1">
                                                    Cantidad: {linea.cantidad}
                                                </div>

                                                <div className="text-muted small">
                                                    {formatearPrecio(linea.precio)} c/u
                                                </div>
                                            </div>

                                            <strong>
                                                {formatearPrecio(linea.subtotal)}
                                            </strong>
                                        </div>
                                    </div>
                                ))}

                                <div className="checkout-total d-flex justify-content-between">
                                    <span>Total</span>
                                    <strong>
                                        {formatearPrecio(detalle.total)}
                                    </strong>
                                </div>
                            </>
                        )}

                        {errores.carrito && (
                            <p className="text-danger mt-3">
                                {errores.carrito}
                            </p>
                        )}
                    </section>
                </div>

                <div className="col-lg-7">
                    <section className="checkout-formulario">
                        <h2 className="h4">Datos de entrega</h2>

                        <form noValidate onSubmit={confirmarCompra}>
                            <div className="mb-4">
                                <label htmlFor="nombre" className="form-label">
                                    Nombre
                                </label>

                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    className={`form-control ${
                                        errores.nombre ? 'is-invalid' : ''
                                    }`}
                                    value={formulario.nombre}
                                    onChange={manejarCambio}
                                />

                                {errores.nombre && (
                                    <div className="invalid-feedback">
                                        {errores.nombre}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="correo" className="form-label">
                                    Correo electrónico
                                </label>

                                <input
                                    id="correo"
                                    name="correo"
                                    type="email"
                                    className={`form-control ${
                                        errores.correo ? 'is-invalid' : ''
                                    }`}
                                    value={formulario.correo}
                                    onChange={manejarCambio}
                                />

                                {errores.correo && (
                                    <div className="invalid-feedback">
                                        {errores.correo}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="direccion" className="form-label">
                                    Dirección
                                </label>

                                <input
                                    id="direccion"
                                    name="direccion"
                                    type="text"
                                    className={`form-control ${
                                        errores.direccion ? 'is-invalid' : ''
                                    }`}
                                    value={formulario.direccion}
                                    onChange={manejarCambio}
                                />

                                {errores.direccion && (
                                    <div className="invalid-feedback">
                                        {errores.direccion}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label htmlFor="comuna" className="form-label">
                                    Comuna
                                </label>

                                <select
                                    id="comuna"
                                    name="comuna"
                                    className={`form-select ${
                                        errores.comuna ? 'is-invalid' : ''
                                    }`}
                                    value={formulario.comuna}
                                    onChange={manejarCambio}
                                >
                                    <option value="">
                                        Selecciona una comuna
                                    </option>

                                    {comunas.map((comuna) => (
                                        <option key={comuna} value={comuna}>
                                            {comuna}
                                        </option>
                                    ))}
                                </select>

                                {errores.comuna && (
                                    <div className="invalid-feedback">
                                        {errores.comuna}
                                    </div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label
                                    htmlFor="indicaciones"
                                    className="form-label"
                                >
                                    Indicaciones para la entrega
                                </label>

                                <textarea
                                    id="indicaciones"
                                    name="indicaciones"
                                    className={`form-control ${
                                        errores.indicaciones ? 'is-invalid' : ''
                                    }`}
                                    rows="4"
                                    value={formulario.indicaciones}
                                    onChange={manejarCambio}
                                />

                                {errores.indicaciones && (
                                    <div className="invalid-feedback">
                                        {errores.indicaciones}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn btn-principal"
                                disabled={detalle.lineas.length === 0}
                            >
                                Confirmar compra
                            </button>
                        </form>
                    </section>
                </div>
            </div>
        </main>
    )
}

export default Checkout