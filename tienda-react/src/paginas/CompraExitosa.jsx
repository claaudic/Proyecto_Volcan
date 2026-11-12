import { Link, useLocation } from 'react-router-dom'
import { formatearPrecio } from '../datos/productos'

function CompraExitosa() {
    const location = useLocation()
    const pedido = location.state?.pedido

    if (!pedido) {
        return (
            <main className="container py-5">
                <section className="compra-exitosa">
                    <div className="compra-exitosa-icono">!</div>

                    <h1>No hay información de la compra</h1>

                    <p className="text-muted">
                        No se encontró un pedido reciente para mostrar.
                    </p>

                    <Link to="/productos" className="btn btn-principal mt-3">
                        Volver al catálogo
                    </Link>
                </section>
            </main>
        )
    }

    return (
        <main className="container py-5">
            <section className="compra-exitosa">
                <div className="compra-exitosa-icono">✓</div>

                <h1>Compra realizada con éxito</h1>

                <p className="text-muted">
                    Tu pedido fue registrado correctamente.
                </p>

                <div className="compra-exitosa-numero">
                    Pedido <strong>#{pedido.numero}</strong>
                </div>

                <div className="compra-exitosa-contenido">
                    <div>
                        <h2 className="h4 mb-3">Resumen del pedido</h2>

                        {pedido.productos.map((producto) => (
                            <div
                                key={producto.codigo}
                                className="compra-exitosa-producto"
                            >
                                <div>
                                    <strong>{producto.nombre}</strong>

                                    <div className="text-muted small">
                                        Cantidad: {producto.cantidad}
                                    </div>
                                </div>

                                <strong>
                                    {formatearPrecio(producto.subtotal)}
                                </strong>
                            </div>
                        ))}

                        <div className="compra-exitosa-total">
                            <span>Total pagado</span>
                            <strong>{formatearPrecio(pedido.total)}</strong>
                        </div>
                    </div>

                    <div>
                        {/* Datos de quien compro (Figura 7 de las instrucciones) */}
                        {pedido.cliente && (
                            <>
                                <h2 className="h4 mb-3">Datos del comprador</h2>

                                <dl className="compra-exitosa-datos">
                                    <dt>Nombre</dt>
                                    <dd>{pedido.cliente.nombre}</dd>

                                    <dt>Correo</dt>
                                    <dd>{pedido.cliente.correo}</dd>

                                    {pedido.cliente.telefono && (
                                        <>
                                            <dt>Teléfono</dt>
                                            <dd>{pedido.cliente.telefono}</dd>
                                        </>
                                    )}

                                    {pedido.pago && (
                                        <>
                                            <dt>Pagado con</dt>
                                            <dd>Tarjeta {pedido.pago.tarjeta}</dd>
                                        </>
                                    )}
                                </dl>
                            </>
                        )}

                        <h2 className="h4 mb-3">Dirección de entrega</h2>

                        <p className="mb-1">
                            <strong>{pedido.entrega.direccion}</strong>
                        </p>

                        <p className="text-muted mb-2">
                            {pedido.entrega.comuna}
                        </p>

                        {pedido.entrega.indicaciones && (
                            <p className="text-muted">
                                Indicaciones: {pedido.entrega.indicaciones}
                            </p>
                        )}
                    </div>
                </div>

                <Link to="/productos" className="btn btn-principal mt-4">
                    Volver al catálogo
                </Link>
            </section>
        </main>
    )
}

export default CompraExitosa