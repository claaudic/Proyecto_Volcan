import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import {
    actualizarPedido,
    leerPedidos
} from '../datos/pedidos'
import { leerUsuarios } from '../datos/usuarios'

const ESTADOS_PEDIDO = [
    'Pendiente',
    'En camino',
    'Entregado',
    'Cancelado'
]

function ordenarPorFecha(pedidos) {
    return [...pedidos].sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
    )
}

function normalizarEstado(estado) {
    const limpio = String(estado || '').trim().toLowerCase()

    if (limpio === 'camino' || limpio === 'en camino') {
        return 'En camino'
    }

    if (limpio === 'entregado') {
        return 'Entregado'
    }

    if (limpio === 'cancelado') {
        return 'Cancelado'
    }

    return 'Pendiente'
}

function claseEstado(estado) {
    const estadoNormalizado = normalizarEstado(estado)

    if (estadoNormalizado === 'En camino') {
        return 'estado estado-camino'
    }

    return `estado estado-${estadoNormalizado
        .toLowerCase()
        .replaceAll(' ', '-')}`
}

function nombreCliente(pedido) {
    if (pedido.cliente && typeof pedido.cliente === 'object') {
        return pedido.cliente.nombre || 'Sin nombre'
    }

    return pedido.cliente || 'Sin nombre'
}

function direccionEntrega(pedido) {
    if (pedido.entrega && typeof pedido.entrega === 'object') {
        return pedido.entrega.direccion || 'Sin dirección'
    }

    return pedido.direccion || 'Sin dirección'
}

function comunaEntrega(pedido) {
    if (pedido.entrega && typeof pedido.entrega === 'object') {
        return pedido.entrega.comuna || 'Sin comuna'
    }

    return pedido.comuna || 'Sin comuna'
}

function Despachadora() {
    const { usuario } = useSesion()
    const [pedidos, setPedidos] = useState(() => ordenarPorFecha(leerPedidos()))

    if (!usuario || usuario.rol !== 'DESPACHADORA') {
        return <Navigate to="/login" replace />
    }

    const repartidores = leerUsuarios().filter(
        (cuenta) =>
            cuenta.rol === 'REPARTIDOR' &&
            cuenta.activo !== false
    )

    const resumen = pedidos.reduce(
        (totales, pedido) => {
            const estado = normalizarEstado(pedido.estado)

            totales.total += 1

            if (estado === 'Pendiente') {
                totales.pendientes += 1
            }

            if (estado === 'En camino') {
                totales.camino += 1
            }

            if (estado === 'Entregado') {
                totales.entregados += 1
            }

            return totales
        },
        {
            total: 0,
            pendientes: 0,
            camino: 0,
            entregados: 0
        }
    )

    function refrescarPedidos() {
        setPedidos(ordenarPorFecha(leerPedidos()))
    }

    function actualizar(numero, cambios) {
        actualizarPedido(numero, cambios)
        refrescarPedidos()
    }

    function fechaActual() {
        return new Intl.DateTimeFormat('es-CL', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(new Date())
    }

    return (
        <main id="contenidoDespacho">
            <section
                className="pagina-encabezado"
                aria-labelledby="titulo-despacho"
            >
                <div className="encabezado-fondo" aria-hidden="true">
                    <span className="luz luz-encabezado-verde"></span>
                    <span className="luz luz-encabezado-celeste"></span>
                    <span className="encabezado-arco"></span>
                </div>

                <div className="container">
                    <p className="panel-etiqueta">
                        Operadora / Despachadora
                    </p>

                    <h1 id="titulo-despacho">
                        Gestión de pedidos del día
                    </h1>

                    <p className="pagina-bajada">
                        Revisa los pedidos registrados, asigna un repartidor
                        y actualiza su estado.
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
                <section
                    className="container panel-seccion"
                    aria-labelledby="titulo-resumen-despacho"
                >
                    <h2
                        id="titulo-resumen-despacho"
                        className="visually-hidden"
                    >
                        Resumen del día
                    </h2>

                    <div className="row g-4">
                        <div className="col-12 col-sm-6 col-lg-3">
                            <article className="tarjeta-dato">
                                <div className="tarjeta-dato-icono tono-tinta" aria-hidden="true">
                                    D
                                </div>
                                <div>
                                    <p className="tarjeta-dato-texto">
                                        Pedidos del día
                                    </p>
                                    <p className="tarjeta-dato-numero">
                                        {resumen.total}
                                    </p>
                                </div>
                            </article>
                        </div>

                        <div className="col-12 col-sm-6 col-lg-3">
                            <article className="tarjeta-dato">
                                <div className="tarjeta-dato-icono tono-rosa" aria-hidden="true">
                                    P
                                </div>
                                <div>
                                    <p className="tarjeta-dato-texto">
                                        Pendientes
                                    </p>
                                    <p className="tarjeta-dato-numero">
                                        {resumen.pendientes}
                                    </p>
                                </div>
                            </article>
                        </div>

                        <div className="col-12 col-sm-6 col-lg-3">
                            <article className="tarjeta-dato">
                                <div className="tarjeta-dato-icono tono-celeste" aria-hidden="true">
                                    C
                                </div>
                                <div>
                                    <p className="tarjeta-dato-texto">
                                        En camino
                                    </p>
                                    <p className="tarjeta-dato-numero">
                                        {resumen.camino}
                                    </p>
                                </div>
                            </article>
                        </div>

                        <div className="col-12 col-sm-6 col-lg-3">
                            <article className="tarjeta-dato">
                                <div className="tarjeta-dato-icono tono-verde" aria-hidden="true">
                                    E
                                </div>
                                <div>
                                    <p className="tarjeta-dato-texto">
                                        Entregados
                                    </p>
                                    <p className="tarjeta-dato-numero">
                                        {resumen.entregados}
                                    </p>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                <section
                    className="container panel-seccion"
                    aria-labelledby="titulo-alcance-despacho"
                >
                    <div className="panel-aviso">
                        <h2 id="titulo-alcance-despacho">
                            Panel de despacho
                        </h2>

                        <p>
                            Puedes visualizar todos los pedidos, asignarlos a
                            repartidores y actualizar su estado. No tienes
                            acceso a la gestión de usuarios del sistema.
                        </p>
                    </div>
                </section>

                <section
                    className="container panel-seccion"
                    aria-labelledby="titulo-pedidos-despacho"
                >
                    <div className="panel-titulo">
                        <div>
                            <p className="panel-etiqueta">Pedidos</p>
                            <h2 id="titulo-pedidos-despacho">
                                Pedidos de hoy
                            </h2>
                        </div>

                        <p className="panel-titulo-nota">
                            {fechaActual()}
                        </p>
                    </div>

                    {pedidos.length === 0 ? (
                        <div className="panel-vacio">
                            <h3>No hay pedidos registrados</h3>
                            <p>Los pedidos del día aparecerán aquí.</p>
                        </div>
                    ) : (
                        <div className="tabla-marco">
                            <div className="table-responsive">
                                <table className="tabla-panel">
                                    <thead>
                                    <tr>
                                        <th>N° Pedido</th>
                                        <th>Cliente</th>
                                        <th>Dirección</th>
                                        <th>Zona</th>
                                        <th>Repartidor</th>
                                        <th>Estado</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {pedidos.map((pedido) => (
                                        <tr key={pedido.numero}>
                                            <td>
                                                <strong>#{pedido.numero}</strong>
                                            </td>
                                            <td>{nombreCliente(pedido)}</td>
                                            <td>
                                                {direccionEntrega(pedido)}
                                            </td>
                                            <td>
                                                <span className="zona-pedido">
                                                    {comunaEntrega(pedido)}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    className="selector-repartidor"
                                                    aria-label={`Asignar repartidor al pedido ${pedido.numero}`}
                                                    value={pedido.repartidor || ''}
                                                    onChange={(evento) =>
                                                        actualizar(
                                                            pedido.numero,
                                                            {
                                                                repartidor:
                                                                    evento.target.value
                                                            }
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Sin asignar
                                                    </option>
                                                    {repartidores.map(
                                                        (repartidor) => (
                                                            <option
                                                                key={repartidor.correo}
                                                                value={repartidor.correo}
                                                            >
                                                                {repartidor.nombre}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </td>
                                            <td>
                                                <span
                                                    className={claseEstado(
                                                        pedido.estado
                                                    )}
                                                >
                                                    {normalizarEstado(
                                                        pedido.estado
                                                    )}
                                                </span>

                                                <select
                                                    className="selector-estado-despacho mt-2"
                                                    aria-label={`Cambiar estado del pedido ${pedido.numero}`}
                                                    value={normalizarEstado(
                                                        pedido.estado
                                                    )}
                                                    onChange={(evento) =>
                                                        actualizar(
                                                            pedido.numero,
                                                            {
                                                                estado:
                                                                    evento.target.value
                                                            }
                                                        )
                                                    }
                                                >
                                                    {ESTADOS_PEDIDO.map(
                                                        (estado) => (
                                                            <option
                                                                key={estado}
                                                                value={estado}
                                                            >
                                                                {estado}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}

export default Despachadora
