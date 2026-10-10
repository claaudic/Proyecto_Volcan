import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import {
    actualizarPedido,
    leerPedidos
} from '../datos/pedidos'

const ESTADOS_REPARTIDOR = [
    'Pendiente',
    'En camino',
    'Entregado'
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

function obtenerLineas(pedido) {
    if (Array.isArray(pedido.productos)) {
        return pedido.productos
    }

    if (Array.isArray(pedido.lineas)) {
        return pedido.lineas
    }

    if (pedido.producto) {
        return [
            {
                nombre: pedido.producto,
                cantidad: pedido.cantidad || 1
            }
        ]
    }

    return []
}

function resumenProductos(pedido) {
    const lineas = obtenerLineas(pedido)

    if (lineas.length === 0) {
        return 'Sin productos'
    }

    const primera = lineas[0]
    const cantidad = Number(primera.cantidad) || 1
    const nombre = primera.nombre || primera.codigo || 'Producto'
    const restantes = lineas.length - 1
    const textoBase = `${cantidad} x ${nombre}`

    if (restantes === 0) {
        return textoBase
    }

    return `${textoBase} y ${restantes} más`
}

function Repartidor() {
    const { usuario } = useSesion()
    const [pedidos, setPedidos] = useState(() => ordenarPorFecha(leerPedidos()))

    if (!usuario || usuario.rol !== 'REPARTIDOR') {
        return <Navigate to="/login" replace />
    }

    const pedidosAsignados = pedidos.filter((pedido) => {
        return (
            String(pedido.repartidor || '').toLowerCase() ===
                String(usuario.correo).toLowerCase() &&
            normalizarEstado(pedido.estado) !== 'Cancelado'
        )
    })

    const resumen = pedidosAsignados.reduce(
        (totales, pedido) => {
            const estado = normalizarEstado(pedido.estado)

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
            pendientes: 0,
            camino: 0,
            entregados: 0
        }
    )

    function refrescarPedidos() {
        setPedidos(ordenarPorFecha(leerPedidos()))
    }

    function cambiarEstado(numero, estado) {
        actualizarPedido(numero, { estado })
        refrescarPedidos()
    }

    return (
        <main id="contenidoRepartidor">
            <section
                className="pagina-encabezado"
                aria-labelledby="titulo-repartidor"
            >
                <div className="encabezado-fondo" aria-hidden="true">
                    <span className="luz luz-encabezado-verde"></span>
                    <span className="luz luz-encabezado-celeste"></span>
                    <span className="encabezado-arco"></span>
                </div>

                <div className="container">
                    <p className="panel-etiqueta">Área de despacho</p>

                    <h1 id="titulo-repartidor">
                        Mis pedidos asignados
                    </h1>

                    <p className="pagina-bajada">
                        Revisa los pedidos de tu ruta y actualiza el estado
                        de cada entrega.
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
                    aria-labelledby="titulo-resumen-repartidor"
                >
                    <h2
                        id="titulo-resumen-repartidor"
                        className="visually-hidden"
                    >
                        Resumen de ruta
                    </h2>

                    <div className="row g-4">
                        <div className="col-12 col-md-4">
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

                        <div className="col-12 col-md-4">
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

                        <div className="col-12 col-md-4">
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
                    aria-labelledby="titulo-pedidos-repartidor"
                >
                    <div className="panel-titulo">
                        <div>
                            <p className="panel-etiqueta">Ruta actual</p>
                            <h2 id="titulo-pedidos-repartidor">
                                Pedidos asignados
                            </h2>
                        </div>

                        <p className="panel-titulo-nota">
                            Solo puedes ver tus pedidos.
                        </p>
                    </div>

                    {pedidosAsignados.length === 0 ? (
                        <div className="panel-vacio">
                            <h3>No tienes pedidos asignados</h3>
                            <p>
                                Cuando la despachadora te asigne una ruta,
                                aparecerá aquí.
                            </p>
                        </div>
                    ) : (
                        <div className="tabla-marco">
                            <div className="table-responsive">
                                <table className="tabla-panel">
                                    <thead>
                                    <tr>
                                        <th>Pedido</th>
                                        <th>Cliente</th>
                                        <th>Dirección</th>
                                        <th>Producto</th>
                                        <th>Estado</th>
                                        <th>Actualizar</th>
                                    </tr>
                                    </thead>

                                    <tbody>
                                    {pedidosAsignados.map((pedido) => {
                                        const estado = normalizarEstado(
                                            pedido.estado
                                        )

                                        return (
                                            <tr key={pedido.numero}>
                                                <td>
                                                    <strong>
                                                        #{pedido.numero}
                                                    </strong>
                                                </td>
                                                <td>{nombreCliente(pedido)}</td>
                                                <td>
                                                    {direccionEntrega(pedido)},{' '}
                                                    {comunaEntrega(pedido)}
                                                </td>
                                                <td>
                                                    {resumenProductos(pedido)}
                                                </td>
                                                <td>
                                                    <span
                                                        className={claseEstado(
                                                            estado
                                                        )}
                                                    >
                                                        {estado}
                                                    </span>
                                                </td>
                                                <td>
                                                    <select
                                                        className="selector-estado"
                                                        aria-label={`Cambiar el estado del pedido ${pedido.numero}`}
                                                        value={estado}
                                                        disabled={
                                                            estado === 'Entregado'
                                                        }
                                                        onChange={(evento) =>
                                                            cambiarEstado(
                                                                pedido.numero,
                                                                evento.target.value
                                                            )
                                                        }
                                                    >
                                                        {ESTADOS_REPARTIDOR.map(
                                                            (opcion) => (
                                                                <option
                                                                    key={opcion}
                                                                    value={opcion}
                                                                    disabled={
                                                                        estado === 'En camino' &&
                                                                        opcion === 'Pendiente'
                                                                    }
                                                                >
                                                                    {opcion}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
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

export default Repartidor
