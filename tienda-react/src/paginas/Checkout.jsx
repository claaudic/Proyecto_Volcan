import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCarrito } from '../contexto/carritoContexto'
import { crearPedido } from '../datos/pedidos'
import { formatearPrecio } from '../datos/productos'
import { validarNombre, validarCorreo } from '../utilidades/validaciones'

function Checkout() {
    const navigate = useNavigate()
    const { detalle, vaciar } = useCarrito()

    const [formulario, setFormulario] = useState({
        nombre: '',
        correo: '',
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
            <h1 className="mb-4">Finalizar compra</h1>

            <div className="row g-4">
                <div className="col-lg-5">
                    <div className="card h-100">
                        <div className="card-body">
                            <h2 className="h4 mb-3">Resumen del pedido</h2>

                            {detalle.lineas.length === 0 ? (
                                <p className="text-muted">
                                    No hay productos en el carrito.
                                </p>
                            ) : (
                                <>
                                    <ul className="list-group list-group-flush mb-3">
                                        {detalle.lineas.map((linea) => (
                                            <li
                                                key={linea.codigo}
                                                className="list-group-item px-0"
                                            >
                                                <div className="d-flex justify-content-between">
                                                    <strong>{linea.nombre}</strong>
                                                    <span>{formatearPrecio(linea.subtotal)}</span>
                                                </div>

                                                <small className="text-muted">
                                                    Cantidad: {linea.cantidad}
                                                    {' · '}
                                                    {formatearPrecio(linea.precio)} c/u
                                                </small>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="d-flex justify-content-between">
                                        <strong>Total</strong>
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
                        </div>
                    </div>
                </div>

                <div className="col-lg-7">
                    <form noValidate onSubmit={confirmarCompra}>
                        <div className="card">
                            <div className="card-body">
                                <h2 className="h4 mb-4">Datos de entrega</h2>

                                <div className="mb-3">
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

                                <div className="mb-3">
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

                                <div className="mb-3">
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

                                <div className="mb-3">
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
                                        <option value="">Selecciona una comuna</option>

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

                                <div className="mb-3">
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
                                        rows="3"
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
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    )
}

export default Checkout