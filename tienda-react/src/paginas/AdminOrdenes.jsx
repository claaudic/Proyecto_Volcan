import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import {
    actualizarPedido,
    eliminarPedido,
    leerPedidos
} from '../datos/pedidos'
import { formatearPrecio } from '../datos/productos'
import { leerUsuarios, nombreDeRol } from '../datos/usuarios'

const ESTADOS_PEDIDO = [
    'Pendiente',
    'En camino',
    'Entregado',
    'Cancelado'
]

function ordenarPorFecha(pedidos) {
    return [...pedidos].sort((a, b) => {
        const fechaA = new Date(a.fecha).getTime()
        const fechaB = new Date(b.fecha).getTime()

        if (Number.isNaN(fechaA) && Number.isNaN(fechaB)) {
            return 0
        }

        if (Number.isNaN(fechaA)) {
            return 1
        }

        if (Number.isNaN(fechaB)) {
            return -1
        }

        return fechaB - fechaA
    })
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
                cantidad: pedido.cantidad || 1,
                precio: pedido.total,
                subtotal: pedido.total
            }
        ]
    }

    return []
}

function nombreCliente(pedido) {
    if (pedido.cliente && typeof pedido.cliente === 'object') {
        return pedido.cliente.nombre || 'Sin nombre'
    }

    return pedido.cliente || 'Sin nombre'
}

function correoCliente(pedido) {
    if (pedido.cliente && typeof pedido.cliente === 'object') {
        return pedido.cliente.correo || ''
    }

    return pedido.correo || ''
}

function telefonoCliente(pedido) {
    if (pedido.cliente && typeof pedido.cliente === 'object') {
        return pedido.cliente.telefono || ''
    }

    return ''
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

function indicacionesEntrega(pedido) {
    if (pedido.entrega && typeof pedido.entrega === 'object') {
        return pedido.entrega.indicaciones || ''
    }

    return ''
}

function medioPago(pedido) {
    if (pedido.pago && typeof pedido.pago === 'object') {
        return pedido.pago.tarjeta || pedido.pago.metodo || ''
    }

    return pedido.pago || ''
}

function resumenProductos(pedido) {
    const lineas = obtenerLineas(pedido)

    if (lineas.length === 0) {
        return 'Sin productos'
    }

    const primera = lineas[0].nombre || lineas[0].codigo || 'Producto'
    const restantes = lineas.length - 1

    if (restantes <= 0) {
        return primera
    }

    return `${primera} y ${restantes} más`
}

function AdminOrdenes() {
    const { usuario } = useSesion()
    const [pedidos, setPedidos] = useState(() => ordenarPorFecha(leerPedidos()))
    const [pedidoDetalle, setPedidoDetalle] = useState(null)
    const [pedidoEditando, setPedidoEditando] = useState(null)
    const [pedidoABorrar, setPedidoABorrar] = useState(null)
    const [formulario, setFormulario] = useState({
        estado: 'Pendiente',
        repartidor: ''
    })

    if (!usuario || usuario.rol !== 'ADMINISTRADOR') {
        return <Navigate to="/login" replace />
    }

    const repartidores = leerUsuarios().filter(
        (cuenta) =>
            cuenta.rol === 'REPARTIDOR' &&
            cuenta.activo !== false
    )

    function refrescarPedidos() {
        setPedidos(ordenarPorFecha(leerPedidos()))
    }

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

    function nombreRepartidor(correo) {
        if (!correo) {
            return 'Sin asignar'
        }

        const repartidor = repartidores.find(
            (cuenta) =>
                cuenta.correo.toLowerCase() ===
                String(correo).toLowerCase()
        )

        return repartidor ? repartidor.nombre : correo
    }

    function abrirEditar(pedido) {
        setPedidoEditando(pedido)
        setFormulario({
            estado: pedido.estado || 'Pendiente',
            repartidor: pedido.repartidor || ''
        })
    }

    function cambiarFormulario(evento) {
        const { name, value } = evento.target

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }))
    }

    function guardarEdicion(evento) {
        evento.preventDefault()

        if (!pedidoEditando) {
            return
        }

        actualizarPedido(pedidoEditando.numero, {
            estado: formulario.estado,
            repartidor: formulario.repartidor
        })

        setPedidoEditando(null)
        refrescarPedidos()
    }

    function confirmarEliminar() {
        if (!pedidoABorrar) {
            return
        }

        eliminarPedido(pedidoABorrar.numero)
        setPedidoABorrar(null)
        refrescarPedidos()
    }

    function cerrarDetalle() {
        setPedidoDetalle(null)
    }

    function cerrarEdicion() {
        setPedidoEditando(null)
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
                                    <th>Productos</th>
                                    <th>Estado</th>
                                    <th>Repartidor</th>
                                    <th>Total</th>
                                    <th>Acciones</th>
                                </tr>
                                </thead>

                                <tbody>
                                {pedidos.length === 0 ? (
                                    <tr>
                                        <td colSpan="9">
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
                                            <td>{nombreCliente(pedido)}</td>
                                            <td>{comunaEntrega(pedido)}</td>
                                            <td>{resumenProductos(pedido)}</td>
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
                                                {nombreRepartidor(
                                                    pedido.repartidor
                                                )}
                                            </td>
                                            <td>
                                                {formatearPrecio(pedido.total)}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-secundario me-1 mb-1"
                                                    aria-label={`Ver boleta del pedido ${pedido.numero}`}
                                                    onClick={() =>
                                                        setPedidoDetalle(pedido)
                                                    }
                                                >
                                                    Ver boleta
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-principal me-1 mb-1"
                                                    aria-label={`Editar pedido ${pedido.numero}`}
                                                    onClick={() =>
                                                        abrirEditar(pedido)
                                                    }
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-peligro mb-1"
                                                    aria-label={`Eliminar pedido ${pedido.numero}`}
                                                    onClick={() =>
                                                        setPedidoABorrar(pedido)
                                                    }
                                                >
                                                    Eliminar
                                                </button>
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

            {pedidoDetalle && (
                <>
                    <div
                        className="modal fade show"
                        style={{ display: 'block' }}
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-boleta-pedido"
                    >
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h2
                                        id="titulo-boleta-pedido"
                                        className="modal-title fs-5"
                                    >
                                        Boleta del pedido #{pedidoDetalle.numero}
                                    </h2>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Cerrar"
                                        onClick={cerrarDetalle}
                                    ></button>
                                </div>

                                <div className="modal-body">
                                    <div className="row g-3 mb-3">
                                        <div className="col-12">
                                            <p className="panel-etiqueta mb-1">
                                                Pedido
                                            </p>

                                            <div className="row g-2">
                                                <div className="col-12 col-md-3">
                                                    <p className="mb-1">
                                                        Fecha
                                                    </p>
                                                    <strong>
                                                        {formatearFecha(
                                                            pedidoDetalle.fecha
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="col-12 col-md-3">
                                                    <p className="mb-1">
                                                        Estado
                                                    </p>
                                                    <span
                                                        className={claseEstado(
                                                            pedidoDetalle.estado
                                                        )}
                                                    >
                                                        {pedidoDetalle.estado}
                                                    </span>
                                                </div>

                                                <div className="col-12 col-md-3">
                                                    <p className="mb-1">
                                                        Repartidor
                                                    </p>
                                                    <strong>
                                                        {nombreRepartidor(
                                                            pedidoDetalle.repartidor
                                                        )}
                                                    </strong>
                                                </div>

                                                <div className="col-12 col-md-3">
                                                    <p className="mb-1">
                                                        Pago
                                                    </p>
                                                    <strong>
                                                        {medioPago(
                                                            pedidoDetalle
                                                        ) || 'Sin registrar'}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <p className="panel-etiqueta mb-1">
                                                Cliente
                                            </p>
                                            <p className="mb-1">
                                                <strong>
                                                    {nombreCliente(pedidoDetalle)}
                                                </strong>
                                            </p>
                                            {correoCliente(pedidoDetalle) && (
                                                <p className="mb-1">
                                                    {correoCliente(pedidoDetalle)}
                                                </p>
                                            )}
                                            {telefonoCliente(pedidoDetalle) && (
                                                <p className="mb-0">
                                                    {telefonoCliente(pedidoDetalle)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-12 col-md-6">
                                            <p className="panel-etiqueta mb-1">
                                                Entrega
                                            </p>
                                            <p className="mb-1">
                                                {direccionEntrega(pedidoDetalle)}
                                            </p>
                                            <p className="mb-1">
                                                {comunaEntrega(pedidoDetalle)}
                                            </p>
                                            {indicacionesEntrega(pedidoDetalle) && (
                                                <p className="mb-0">
                                                    {indicacionesEntrega(
                                                        pedidoDetalle
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="tabla-marco table-responsive">
                                        <table className="tabla-panel">
                                            <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Cantidad</th>
                                                <th>Precio</th>
                                                <th>Subtotal</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {obtenerLineas(pedidoDetalle)
                                                .length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4">
                                                            Sin productos registrados.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    obtenerLineas(
                                                        pedidoDetalle
                                                    ).map((linea, indice) => (
                                                        <tr
                                                            key={`${linea.codigo || linea.nombre}-${indice}`}
                                                        >
                                                            <td>
                                                                {linea.nombre ||
                                                                    linea.codigo ||
                                                                    'Producto'}
                                                            </td>
                                                            <td>
                                                                {linea.cantidad || 1}
                                                            </td>
                                                            <td>
                                                                {formatearPrecio(
                                                                    linea.precio || 0
                                                                )}
                                                            </td>
                                                            <td>
                                                                {formatearPrecio(
                                                                    linea.subtotal ||
                                                                    (Number(linea.precio) || 0) *
                                                                    (Number(linea.cantidad) || 1)
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <p className="text-end mt-3 mb-0">
                                        <strong>
                                            Total:{' '}
                                            {formatearPrecio(
                                                pedidoDetalle.total
                                            )}
                                        </strong>
                                    </p>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secundario"
                                        onClick={cerrarDetalle}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {pedidoEditando && (
                <>
                    <div
                        className="modal fade show"
                        style={{ display: 'block' }}
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-editar-pedido"
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h2
                                        id="titulo-editar-pedido"
                                        className="modal-title fs-5"
                                    >
                                        Editar pedido #{pedidoEditando.numero}
                                    </h2>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Cerrar"
                                        onClick={cerrarEdicion}
                                    ></button>
                                </div>

                                <form onSubmit={guardarEdicion}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label
                                                htmlFor="estadoPedido"
                                                className="form-label"
                                            >
                                                Estado
                                            </label>

                                            <select
                                                id="estadoPedido"
                                                name="estado"
                                                className="selector-estado w-100"
                                                value={formulario.estado}
                                                onChange={cambiarFormulario}
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
                                        </div>

                                        <div className="mb-0">
                                            <label
                                                htmlFor="repartidorPedido"
                                                className="form-label"
                                            >
                                                Repartidor
                                            </label>

                                            <select
                                                id="repartidorPedido"
                                                name="repartidor"
                                                className="selector-repartidor w-100"
                                                value={formulario.repartidor}
                                                onChange={cambiarFormulario}
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
                                                            {repartidor.nombre} -{' '}
                                                            {nombreDeRol(
                                                                repartidor.rol
                                                            )}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secundario"
                                            onClick={cerrarEdicion}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-principal"
                                        >
                                            Guardar cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}

            {pedidoABorrar && (
                <>
                    <div
                        className="modal fade show"
                        style={{ display: 'block' }}
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-eliminar-pedido"
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h2
                                        id="titulo-eliminar-pedido"
                                        className="modal-title fs-5"
                                    >
                                        ¿Eliminar pedido?
                                    </h2>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Cerrar"
                                        onClick={() =>
                                            setPedidoABorrar(null)
                                        }
                                    ></button>
                                </div>

                                <div className="modal-body">
                                    <p className="mb-0">
                                        Vas a eliminar el pedido{' '}
                                        <strong>
                                            #{pedidoABorrar.numero}
                                        </strong>{' '}
                                        de {nombreCliente(pedidoABorrar)}.
                                    </p>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secundario"
                                        onClick={() =>
                                            setPedidoABorrar(null)
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-peligro"
                                        onClick={confirmarEliminar}
                                    >
                                        Sí, eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </main>
    )
}

export default AdminOrdenes
