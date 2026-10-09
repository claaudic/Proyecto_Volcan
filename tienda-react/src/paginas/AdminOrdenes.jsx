import { Link, Navigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import { leerPedidos } from '../datos/pedidos'
import { formatearPrecio } from '../datos/productos'

function AdminOrdenes() {
    const { usuario } = useSesion()

    if (!usuario || usuario.rol !== 'ADMINISTRADOR') {
        return <Navigate to="/login" replace />
    }

    const pedidos = [...leerPedidos()].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
    )

    function claseEstado(estado) {
        if (estado === 'En camino') {
            return 'estado estado-camino'
        }

        return `estado estado-${String(estado)
            .toLowerCase()
            .replaceAll(' ', '-')}`
    }

    function formatearFecha(fecha) {
        if (!fecha) {
            return 'Sin fecha'
        }

        const fechaPedido = new Date(fecha)

        if (Number.isNaN(fechaPedido.getTime())) {
            return 'Sin fecha'
        }

        return new Intl.DateTimeFormat('es-CL', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(fechaPedido)
    }

    return (
        <main id="contenidoAdmin">
            <section
                className="pagina-encabezado"
                aria-labelledby="titulo-pagina"
            >
                <div className="encabezado-fondo" aria-hidden="true">
                    <span className="luz luz-encabezado-verde"></span>
                    <span className="luz luz-encabezado-celeste"></span>
                    <span className="encabezado-arco"></span>
                </div>

                <div className="container">
                    <p className="panel-etiqueta">Administración</p>

                    <h1 id="titulo-pagina">Órdenes</h1>

                    <p className="pagina-bajada">
                        Revisa todos los pedidos registrados por la tienda.
                    </p>

                    <p className="encabezado-accion">
                        <Link className="btn btn-secundario" to="/admin">
                            Volver al panel
                        </Link>
                    </p>
                </div>

                <svg
                    className="encabezado-monte"
                    viewBox="0 0 1440 60"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
                </svg>
            </section>

            <div className="panel-cuerpo">
                <div className="container">
                    <section
                        className="panel-seccion"
                        aria-labelledby="titulo-ordenes"
                    >
                        <div className="panel-titulo">
                            <div>
                                <p className="panel-etiqueta">Actividad</p>
                                <h2 id="titulo-ordenes">Todas las órdenes</h2>
                            </div>
                        </div>

                        <div className="tabla-marco table-responsive">
                            <table className="tabla-panel">
                                <thead>
                                <tr>
                                    <th>N° Pedido</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Comuna</th>
                                    <th>Estado</th>
                                    <th>Repartidor</th>
                                    <th>Total</th>
                                </tr>
                                </thead>

                                <tbody>
                                {pedidos.length === 0 ? (
                                    <tr>
                                        <td colSpan="7">
                                            Todavía no hay pedidos registrados.
                                        </td>
                                    </tr>
                                ) : (
                                    pedidos.map((pedido) => (
                                        <tr key={pedido.numero}>
                                            <td>
                                                <strong>#{pedido.numero}</strong>
                                            </td>
                                            <td>{formatearFecha(pedido.fecha)}</td>
                                            <td>
                                                {pedido.cliente?.nombre ||
                                                    'Sin nombre'}
                                            </td>
                                            <td>
                                                {pedido.entrega?.comuna ||
                                                    'Sin comuna'}
                                            </td>
                                            <td>
                                                <span
                                                    className={claseEstado(
                                                        pedido.estado
                                                    )}
                                                >
                                                    {pedido.estado}
                                                </span>
                                            </td>
                                            <td>
                                                {pedido.repartidor ||
                                                    'Sin asignar'}
                                            </td>
                                            <td>
                                                {formatearPrecio(pedido.total)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}

export default AdminOrdenes
