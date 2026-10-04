import { useState } from 'react'
import { useCarrito } from '../contexto/carritoContexto'

function Checkout() {
    const { items } = useCarrito()

    const [formulario, setFormulario] = useState({
        nombre: '',
        apellido: '',
        correo: '',
        calle: '',
        departamento: '',
        region: '',
        comuna: '',
        indicaciones: ''
    })

    function manejarCambio(e) {
        const { name, value } = e.target

        setFormulario({
            ...formulario,
            [name]: value
        })
    }

    function manejarEnvio(e) {
        e.preventDefault()

        console.log('Datos del pedido:', formulario)
        console.log('Productos del carrito:', items)

        alert('Datos del checkout registrados correctamente')
    }

    return (
        <main className="container py-5">
            <h1 className="mb-4">Checkout</h1>

            <div className="row g-4">

                <div className="col-lg-5">
                    <div className="card">
                        <div className="card-body">
                            <h4>Carrito de compra</h4>

                            {items.length === 0 ? (
                                <p className="text-muted">
                                    No hay productos en el carrito.
                                </p>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {items.map((item) => (
                                        <li
                                            key={item.codigo}
                                            className="list-group-item d-flex justify-content-between"
                                        >
                                            <span>{item.codigo}</span>
                                            <span>Cantidad: {item.cantidad}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-7">
                    <form onSubmit={manejarEnvio}>

                        <div className="card mb-4">
                            <div className="card-body">
                                <h4>Información del cliente</h4>

                                <div className="row g-3">

                                    <div className="col-md-6">
                                        <label className="form-label">Nombre</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="nombre"
                                            value={formulario.nombre}
                                            onChange={manejarCambio}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Apellido</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="apellido"
                                            value={formulario.apellido}
                                            onChange={manejarCambio}
                                            required
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label">Correo</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="correo"
                                            value={formulario.correo}
                                            onChange={manejarCambio}
                                            required
                                        />
                                    </div>

                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <h4>Dirección de entrega</h4>

                                <div className="row g-3">

                                    <div className="col-md-8">
                                        <label className="form-label">Calle</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="calle"
                                            value={formulario.calle}
                                            onChange={manejarCambio}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">Departamento</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="departamento"
                                            value={formulario.departamento}
                                            onChange={manejarCambio}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Región</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="region"
                                            value={formulario.region}
                                            onChange={manejarCambio}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Comuna</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="comuna"
                                            value={formulario.comuna}
                                            onChange={manejarCambio}
                                            required
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label">
                                            Indicaciones para la entrega
                                        </label>

                                        <textarea
                                            className="form-control"
                                            name="indicaciones"
                                            value={formulario.indicaciones}
                                            onChange={manejarCambio}
                                            rows="3"
                                        />
                                    </div>

                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary mt-4"
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