import { Link, Navigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import { useCatalogo } from '../contexto/catalogoContexto'

import { leerPedidos } from '../datos/pedidos'
import { formatearPrecio } from '../datos/productos'

function AdminDashboard() {
    const { usuario } = useSesion()
    const { productos } = useCatalogo()

    // Solo puede entrar el administrador
    if (!usuario || usuario.rol !== 'ADMINISTRADOR') {
        return <Navigate to="/login" replace />
    }

    const pedidos = leerPedidos()

    // =========================
    // INDICADORES
    // =========================

    const pendientes = pedidos.filter(
        (pedido) => pedido.estado === 'Pendiente'
    ).length

    const sinRepartidor = pedidos.filter(
        (pedido) => !pedido.repartidor
    ).length

    const productosPorStock = [...productos].sort(
        (a, b) => Number(a.stock) - Number(b.stock)
    )

    const productoMenorStock =
        productosPorStock.length > 0
            ? productosPorStock[0]
            : null

    const totalVendido = pedidos.reduce((total, pedido) => {
        if (pedido.estado === 'Cancelado') {
            return total
        }

        return total + Number(pedido.total || 0)
    }, 0)

    // Últimos pedidos ordenados por fecha
    const ultimosPedidos = [...pedidos]
        .sort(
            (a, b) =>
                new Date(b.fecha) - new Date(a.fecha)
        )
        .slice(0, 5)

    const productosStockBajo =
        productosPorStock.slice(0, 5)

    function claseEstado(estado) {
        if (estado === 'En camino') {
            return 'estado estado-camino'
        }

        return `estado estado-${String(estado)
            .toLowerCase()
            .replaceAll(' ', '-')}`
    }

    return (
        <main id="contenidoAdmin">

            {/* =========================
                ENCABEZADO
            ========================== */}

            <section
                className="pagina-encabezado"
                aria-labelledby="titulo-pagina"
            >
                <div
                    className="encabezado-fondo"
                    aria-hidden="true"
                >
                    <span className="luz luz-encabezado-verde"></span>
                    <span className="luz luz-encabezado-celeste"></span>
                    <span className="encabezado-arco"></span>
                </div>

                <div className="container">

                    <p className="panel-etiqueta">
                        Administración
                    </p>

                    <h1 id="titulo-pagina">
                        Panel de administración
                    </h1>

                    <p className="pagina-bajada">
                        Gestiona el catálogo, las cuentas de
                        usuario y las órdenes del sistema.
                    </p>

                    <p className="encabezado-accion">
                        <Link
                            className="btn btn-secundario"
                            to="/"
                        >
                            Ver la tienda
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

                    {/* =========================
                        RESUMEN
                    ========================== */}

                    <section
                        className="panel-seccion"
                        aria-labelledby="titulo-resumen"
                    >
                        <h2
                            id="titulo-resumen"
                            className="visually-hidden"
                        >
                            Resumen del día
                        </h2>

                        <div className="row g-4">

                            {/* PEDIDOS PENDIENTES */}

                            <div className="col-12 col-sm-6 col-lg-3">

                                <article className="tarjeta-dato">

                                    <div
                                        className="tarjeta-dato-icono tono-rosa"
                                        aria-hidden="true"
                                    >
                                        P
                                    </div>

                                    <div>
                                        <p className="tarjeta-dato-texto">
                                            Pedidos pendientes
                                        </p>

                                        <p className="tarjeta-dato-numero">
                                            {pendientes}
                                        </p>
                                    </div>

                                </article>

                            </div>

                            {/* SIN REPARTIDOR */}

                            <div className="col-12 col-sm-6 col-lg-3">

                                <article className="tarjeta-dato">

                                    <div
                                        className="tarjeta-dato-icono tono-celeste"
                                        aria-hidden="true"
                                    >
                                        R
                                    </div>

                                    <div>
                                        <p className="tarjeta-dato-texto">
                                            Sin repartidor asignado
                                        </p>

                                        <p className="tarjeta-dato-numero">
                                            {sinRepartidor}
                                        </p>
                                    </div>

                                </article>

                            </div>

                            {/* STOCK */}

                            <div className="col-12 col-sm-6 col-lg-3">

                                <article className="tarjeta-dato">

                                    <div
                                        className="tarjeta-dato-icono tono-tinta"
                                        aria-hidden="true"
                                    >
                                        S
                                    </div>

                                    <div>
                                        <p className="tarjeta-dato-texto">
                                            Stock más bajo
                                        </p>

                                        <p className="tarjeta-dato-numero">
                                            {productoMenorStock
                                                ? productoMenorStock.stock
                                                : 0}
                                        </p>

                                        {productoMenorStock && (
                                            <small>
                                                {
                                                    productoMenorStock.nombre
                                                }
                                            </small>
                                        )}
                                    </div>

                                </article>

                            </div>

                            {/* TOTAL */}

                            <div className="col-12 col-sm-6 col-lg-3">

                                <article className="tarjeta-dato">

                                    <div
                                        className="tarjeta-dato-icono tono-verde"
                                        aria-hidden="true"
                                    >
                                        $
                                    </div>

                                    <div>
                                        <p className="tarjeta-dato-texto">
                                            Total registrado
                                        </p>

                                        <p className="tarjeta-dato-numero">
                                            {
                                                formatearPrecio(
                                                    totalVendido
                                                )
                                            }
                                        </p>
                                    </div>

                                </article>

                            </div>

                        </div>
                    </section>

                    {/* =========================
                        ACCESOS ADMINISTRADOR
                    ========================== */}

                    <section className="panel-seccion">

                        <div className="panel-titulo">

                            <div>
                                <p className="panel-etiqueta">
                                    Administración
                                </p>

                                <h2>
                                    Accesos del administrador
                                </h2>
                            </div>

                        </div>

                        <div className="d-flex gap-2 flex-wrap">

                            <Link
                                to="/admin/productos"
                                className="btn btn-principal"
                            >
                                Gestionar productos
                            </Link>

                            <Link
                                to="/admin/usuarios"
                                className="btn btn-secundario"
                            >
                                Gestionar usuarios
                            </Link>

                        </div>

                    </section>

                    {/* =========================
                        ÚLTIMOS PEDIDOS
                    ========================== */}

                    <section
                        className="panel-seccion"
                        aria-labelledby="titulo-ultimos"
                    >
                        <div className="panel-titulo">

                            <div>
                                <p className="panel-etiqueta">
                                    Actividad
                                </p>

                                <h2 id="titulo-ultimos">
                                    Últimos pedidos
                                </h2>
                            </div>

                            <p className="panel-titulo-nota">
                                <Link to="/admin/ordenes">
                                    Ver todas las órdenes
                                </Link>
                            </p>

                        </div>

                        <div className="tabla-marco table-responsive">

                            <table className="tabla-panel">

                                <thead>
                                <tr>
                                    <th>N° Pedido</th>
                                    <th>Cliente</th>
                                    <th>Comuna</th>
                                    <th>Estado</th>
                                    <th>Total</th>
                                </tr>
                                </thead>

                                <tbody>

                                {ultimosPedidos.length === 0 ? (

                                    <tr>
                                        <td colSpan="5">
                                            Todavía no hay pedidos
                                            registrados.
                                        </td>
                                    </tr>

                                ) : (

                                    ultimosPedidos.map(
                                        (pedido) => (

                                            <tr key={pedido.numero}>

                                                <td>
                                                    <strong>
                                                        #{pedido.numero}
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        pedido.cliente
                                                            ?.nombre ||
                                                        'Sin nombre'
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        pedido.entrega
                                                            ?.comuna ||
                                                        'Sin comuna'
                                                    }
                                                </td>

                                                <td>
                                                        <span
                                                            className={
                                                                claseEstado(
                                                                    pedido.estado
                                                                )
                                                            }
                                                        >
                                                            {
                                                                pedido.estado
                                                            }
                                                        </span>
                                                </td>

                                                <td>
                                                    {
                                                        formatearPrecio(
                                                            pedido.total
                                                        )
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                                </tbody>

                            </table>

                        </div>

                    </section>

                    {/* =========================
                        STOCK BAJO
                    ========================== */}

                    <section
                        className="panel-seccion"
                        aria-labelledby="titulo-stock"
                    >
                        <div className="panel-titulo">

                            <div>
                                <p className="panel-etiqueta">
                                    Inventario
                                </p>

                                <h2 id="titulo-stock">
                                    Productos con menos stock
                                </h2>
                            </div>

                            <p className="panel-titulo-nota">
                                <Link to="/admin/productos">
                                    Ir al catálogo
                                </Link>
                            </p>

                        </div>

                        <div className="tabla-marco table-responsive">

                            <table className="tabla-panel">

                                <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Stock</th>
                                </tr>
                                </thead>

                                <tbody>

                                {productosStockBajo.length === 0 ? (

                                    <tr>
                                        <td colSpan="3">
                                            No hay productos en el
                                            catálogo.
                                        </td>
                                    </tr>

                                ) : (

                                    productosStockBajo.map(
                                        (producto) => (

                                            <tr
                                                key={
                                                    producto.codigo
                                                }
                                            >
                                                <td>
                                                    {
                                                        producto.nombre
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        producto.categoria
                                                    }
                                                </td>

                                                <td>
                                                    <strong>
                                                        {
                                                            producto.stock
                                                        }
                                                    </strong>
                                                </td>
                                            </tr>

                                        )
                                    )

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

export default AdminDashboard