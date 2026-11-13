import { useState } from 'react'
import { Link } from 'react-router-dom'

import { usePedidosHttp } from '../utilidades/usePedidosHttp'
import { puedeCambiarEstado } from '../datos/pedidosGestionApi'
import { formatearPrecio } from '../datos/productos'
import { nombreCompleto, nombreDeRol } from '../datos/usuarios'
import { useApi } from '../utilidades/useApi'

const ESTADOS_PEDIDO = [
    'Pendiente',
    'En camino',
    'Entregado',
    'Cancelado'
]

// Los pedidos llegan de ms-pedidos (GET /boletas/gestion) siempre con la misma forma:
// productos [], cliente { nombre, correo, telefono } y entrega { direccion, comuna }
function obtenerLineas(pedido) {
    return pedido.productos || []
}

function nombreCliente(pedido) {
    return pedido.cliente?.nombre || 'Sin nombre'
}

function correoCliente(pedido) {
    return pedido.cliente?.correo || ''
}

function telefonoCliente(pedido) {
    return pedido.cliente?.telefono || ''
}

function direccionEntrega(pedido) {
    return pedido.entrega?.direccion || 'Sin dirección'
}

function comunaEntrega(pedido) {
    return pedido.entrega?.comuna || 'Sin comuna'
}

function indicacionesEntrega(pedido) {
    return pedido.entrega?.indicaciones || ''
}

// Toda compra pasa por la pasarela del checkout antes de crear la boleta.
// El número de la tarjeta no se guarda en el backend (por seguridad), por eso no se muestra.
function medioPago() {
    return 'Pagado en línea con tarjeta'
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
    const datos = usePedidosHttp()
    const { pedidos } = datos
    const [pedidoDetalle, setPedidoDetalle] = useState(null)
    const [pedidoEditando, setPedidoEditando] = useState(null)
    const [pedidoABorrar, setPedidoABorrar] = useState(null)
    const [formulario, setFormulario] = useState({
        estado: 'Pendiente',
        repartidor: ''
    })

    // ms-usuarios entrega solo los repartidores activos
    const lista = useApi('/usuarios/repartidores')

    const repartidores = lista.datos || []

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

    function nombreRepartidor(id) {
        if (!id) {
            return 'Sin asignar'
        }

        const repartidor = repartidores.find(
            (cuenta) =>
                String(cuenta.id) === String(id)
        )

        return repartidor ? nombreCompleto(repartidor) : 'Sin registrar'
    }

    function abrirEditar(pedido) {
        setPedidoEditando({ ...pedido, identidadVista: datos.identidad })
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

    async function guardarEdicion(evento) {
        evento.preventDefault()

        if (!pedidoEditando) {
            return
        }

        const resultado = await datos.guardar(pedidoEditando, { ...formulario })
        if (resultado.ok) setPedidoEditando(null)
    }

    async function confirmarEliminar() {
        if (!pedidoABorrar) {
            return
        }

        const resultado = await datos.anular(pedidoABorrar)
        if (resultado.ok) setPedidoABorrar(null)
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

                        {(lista.error || datos.error) && (
                            <div className="alert alert-warning" role="alert">
                                {lista.error ? <>No se pudo cargar la lista de repartidores. {lista.error}</> : datos.error}
                            </div>
                        )}

                        <div className="tabla-marco table-responsive">
                            <table className="tabla-panel" aria-busy={datos.cargando || datos.ocupado}>
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
                                            {datos.cargando ? '…' : datos.error ? '—' : 'Todavía no hay pedidos registrados.'}
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
                                                        setPedidoDetalle({ ...pedido, identidadVista: datos.identidad })
                                                    }
                                                >
                                                    Ver boleta
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-principal me-1 mb-1"
                                                    aria-label={`Editar pedido ${pedido.numero}`}
                                                    disabled={datos.ocupado || datos.obsoleto(pedido) || ['Entregado', 'Cancelado'].includes(pedido.estado)}
                                                    onClick={() =>
                                                        abrirEditar(pedido)
                                                    }
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-peligro mb-1"
                                                    aria-label={`Anular pedido ${pedido.numero}`}
                                                    disabled={datos.ocupado || datos.obsoleto(pedido) || pedido.estado !== 'Pendiente'}
                                                    onClick={() =>
                                                        setPedidoABorrar({ ...pedido, identidadVista: datos.identidad })
                                                    }
                                                >
                                                    Anular
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

            {pedidoDetalle && pedidoDetalle.identidadVista === datos.identidad && (
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
                                                        {medioPago()}
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

            {pedidoEditando && pedidoEditando.identidadVista === datos.identidad && (
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
                                                disabled={datos.ocupado || datos.obsoleto(pedidoEditando)}
                                                value={formulario.estado}
                                                onChange={cambiarFormulario}
                                            >
                                                {ESTADOS_PEDIDO.map(
                                                    (estado) => (
                                                        <option
                                                            key={estado}
                                                            value={estado}
                                                            disabled={!puedeCambiarEstado(pedidoEditando.estado, estado)}
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
                                                disabled={datos.ocupado || datos.obsoleto(pedidoEditando) || pedidoEditando.estado !== 'Pendiente' || lista.cargando || Boolean(lista.error)}
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
                                                            value={String(repartidor.id)}
                                                        >
                                                            {nombreCompleto(repartidor)} -{' '}
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
                                            disabled={datos.ocupado || datos.obsoleto(pedidoEditando)}
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

            {pedidoABorrar && pedidoABorrar.identidadVista === datos.identidad && (
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
                                        ¿Anular pedido?
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
                                        Vas a anular el pedido{' '}
                                        <strong>
                                            #{pedidoABorrar.numero}
                                        </strong>{' '}
                                        de {nombreCliente(pedidoABorrar)}. Quedará como
                                        Cancelado y el stock vuelve al catálogo. El pedido no
                                        se borra: sigue en el historial.
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
                                        disabled={datos.ocupado || datos.obsoleto(pedidoABorrar) || pedidoABorrar.estado !== 'Pendiente'}
                                    >
                                        Sí, anular
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
