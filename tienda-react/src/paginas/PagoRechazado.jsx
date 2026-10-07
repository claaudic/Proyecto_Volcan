import { Link } from 'react-router-dom'

function PagoRechazado() {
    return (
        <main className="container py-5">
            <section className="pago-rechazado">
                <div className="pago-rechazado-icono">!</div>

                <h1>Pago rechazado</h1>

                <p className="text-muted">
                    No se pudo realizar el pago.
                </p>

                <div className="pago-rechazado-mensaje">
                    <p className="mb-0">
                        Tus productos siguen guardados en el carrito.
                        Puedes volver al checkout e intentar el pago nuevamente.
                    </p>
                </div>

                <Link to="/checkout" className="btn btn-principal mt-4">
                    Volver a intentar
                </Link>
            </section>
        </main>
    )
}

export default PagoRechazado