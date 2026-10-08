import { Link, useLocation } from 'react-router-dom'

function PagoRechazado() {
    // El checkout manda el motivo del rechazo al navegar hasta aqui
    const location = useLocation()
    const motivo = location.state?.motivo

    return (
        <main className="container py-5">
            <section className="pago-rechazado">
                <div className="pago-rechazado-icono">!</div>

                <h1>Pago rechazado</h1>

                <p className="text-muted">
                    No se pudo realizar el pago.
                    {motivo && <strong> {motivo}</strong>}
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