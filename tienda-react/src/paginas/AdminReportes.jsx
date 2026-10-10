import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import { leerPedidos } from '../datos/pedidos'
import { formatearPrecio } from '../datos/productos'
import { leerUsuarios } from '../datos/usuarios'

const ROLES_REPORTE = [
    ['ADMINISTRADOR', 'Administradores'],
    ['DESPACHADORA', 'Despachadoras'],
    ['REPARTIDOR', 'Repartidores'],
    ['CLIENTE', 'Clientes']
]

const ESTADOS_REPORTE = [
    'Pendiente',
    'En camino',
    'Cancelado',
    'Entregado'
]

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

function resumenProductos(pedido) {
    const lineas = obtenerLineas(pedido)

    if (lineas.length === 0) {
        return 'Sin productos'
    }

    const primera = lineas[0].nombre || lineas[0].codigo || 'Producto'
    const restantes = lineas.length - 1

    if (restantes === 0) {
        return primera
    }

    return `${primera} y ${restantes} más`
}

function cantidadProductos(pedido) {
    return obtenerLineas(pedido).reduce(
        (total, linea) => total + (Number(linea.cantidad) || 0),
        0
    )
}

function textoCsv(valor) {
    const texto = String(valor === undefined || valor === null ? '' : valor)

    if (
        texto.includes(';') ||
        texto.includes('\n') ||
        texto.includes('"')
    ) {
        return `"${texto.replaceAll('"', '""')}"`
    }

    return texto
}

function filaCsv(celdas) {
    return celdas.map(textoCsv).join(';')
}

function nombreArchivoReporte(fecha = new Date()) {
    const dos = (numero) => String(numero).padStart(2, '0')

    return [
        'reporte-gas-el-volcan',
        fecha.getFullYear(),
        dos(fecha.getMonth() + 1),
        dos(fecha.getDate())
    ].join('-') + '.csv'
}

function armarReporteCsv(usuarios, pedidos, nombreRepartidor) {
    const cantidadPorRol = (rol) =>
        usuarios.filter((usuario) => usuario.rol === rol).length

    const cantidadPorEstado = (estado) =>
        pedidos.filter(
            (pedido) => normalizarEstado(pedido.estado) === estado
        ).length

    const lineas = []

    lineas.push(filaCsv(['REPORTE GAS EL VOLCAN']))
    lineas.push(filaCsv(['RESUMEN']))
    lineas.push(filaCsv(['Concepto', 'Cantidad']))
    lineas.push(filaCsv(['Usuarios totales', usuarios.length]))
    lineas.push(filaCsv([
        'Usuarios activos',
        usuarios.filter((usuario) => usuario.activo !== false).length
    ]))

    ROLES_REPORTE.forEach(([rol, etiqueta]) => {
        lineas.push(filaCsv([etiqueta, cantidadPorRol(rol)]))
    })

    lineas.push('')
    lineas.push(filaCsv(['Pedidos totales', pedidos.length]))

    ESTADOS_REPORTE.forEach((estado) => {
        lineas.push(filaCsv([estado, cantidadPorEstado(estado)]))
    })

    lineas.push('')
    lineas.push(filaCsv(['DETALLE DE PEDIDOS']))
    lineas.push(filaCsv([
        'N Pedido',
        'Cliente',
        'Direccion',
        'Comuna',
        'Productos',
        'Cantidad',
        'Total',
        'Estado',
        'Repartidor'
    ]))

    pedidos.forEach((pedido) => {
        lineas.push(filaCsv([
            pedido.numero,
            nombreCliente(pedido),
            direccionEntrega(pedido),
            comunaEntrega(pedido),
            resumenProductos(pedido),
            cantidadProductos(pedido),
            pedido.total,
            normalizarEstado(pedido.estado),
            nombreRepartidor(pedido.repartidor)
        ]))
    })

    return lineas.join('\n')
}

function AdminReportes() {
    const { usuario } = useSesion()
    const [avisoDescarga, setAvisoDescarga] = useState('')

    if (!usuario || usuario.rol !== 'ADMINISTRADOR') {
        return <Navigate to="/login" replace />
    }

    const usuarios = leerUsuarios()
    const pedidos = leerPedidos()

    const usuariosActivos = usuarios.filter(
        (cuenta) => cuenta.activo !== false
    ).length

    const pedidosPorEstado = ESTADOS_REPORTE.reduce((resumen, estado) => {
        resumen[estado] = pedidos.filter(
            (pedido) => normalizarEstado(pedido.estado) === estado
        ).length

        return resumen
    }, {})

    const pedidosEntregados = pedidosPorEstado.Entregado || 0

    const totalRegistrado = pedidos.reduce((total, pedido) => {
        if (normalizarEstado(pedido.estado) === 'Cancelado') {
            return total
        }

        return total + Number(pedido.total || 0)
    }, 0)

    function nombreRepartidor(correo) {
        if (!correo) {
            return 'Sin asignar'
        }

        const repartidor = usuarios.find(
            (cuenta) =>
                cuenta.correo.toLowerCase() ===
                String(correo).toLowerCase()
        )

        return repartidor ? repartidor.nombre : correo
    }

    function descargarReporte() {
        const archivo = nombreArchivoReporte()
        const contenido = `\uFEFF${armarReporteCsv(
            usuarios,
            pedidos,
            nombreRepartidor
        )}`

        const blob = new Blob([contenido], {
            type: 'text/csv;charset=utf-8;'
        })

        const url = URL.createObjectURL(blob)
        const enlace = document.createElement('a')

        enlace.href = url
        enlace.download = archivo

        document.body.appendChild(enlace)
        enlace.click()
        document.body.removeChild(enlace)
        URL.revokeObjectURL(url)

        setAvisoDescarga(`Se descargó ${archivo}`)
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

                    <h1 id="titulo-pagina">Reportes del sistema</h1>

                    <p className="pagina-bajada">
                        Revisa información general de usuarios, pedidos y
                        actividad del sistema.
                    </p>

                    <p className="encabezado-accion">
                        <button
                            type="button"
                            className="btn btn-principal"
                            onClick={descargarReporte}
                        >
                            Descargar reporte
                        </button>

                        <Link
                            className="btn btn-secundario ms-2"
                            to="/admin"
                        >
                            Volver al panel
                        </Link>
                    </p>

                    {avisoDescarga && (
                        <p className="mensaje-descarga" role="status">
                            {avisoDescarga}
                        </p>
                    )}
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
                        aria-labelledby="titulo-resumen-reportes"
                    >
                        <div className="panel-titulo">
                            <div>
                                <p className="panel-etiqueta">
                                    Información general
                                </p>

                                <h2 id="titulo-resumen-reportes">
                                    Resumen del sistema
                                </h2>
                            </div>
                        </div>

                        <div className="row g-4">
                            <div className="col-12 col-md-6 col-xl-3">
                                <article className="tarjeta-dato">
                                    <div>
                                        <p className="tarjeta-dato-texto">
                                            Usuarios registrados
                                        </p>
                                        <p className="tarjeta-dato-numero">
                                            {usuarios.length}
                                        </p>
                                    </div>
                                </article>
                            </div>

                            <div className="col-12 col-md-6 col-xl-3">
                                <article className="tarjeta-dato">
                                    <div>
                                        <p className="tarjeta-dato-texto">
                                            Usuarios activos
                                        </p>
                                        <p className="tarjeta-dato-numero">
                                            {usuariosActivos}
                                        </p>
                                    </div>
                                </article>
                            </div>

                            <div className="col-12 col-md-6 col-xl-3">
                                <article className="tarjeta-dato">
                                    <div>
                                        <p className="tarjeta-dato-texto">
                                            Pedidos registrados
                                        </p>
                                        <p className="tarjeta-dato-numero">
                                            {pedidos.length}
                                        </p>
                                    </div>
                                </article>
                            </div>

                            <div className="col-12 col-md-6 col-xl-3">
                                <article className="tarjeta-dato">
                                    <div>
                                        <p className="tarjeta-dato-texto">
                                            Pedidos entregados
                                        </p>
                                        <p className="tarjeta-dato-numero">
                                            {pedidosEntregados}
                                        </p>
                                        <small>
                                            {formatearPrecio(totalRegistrado)}
                                        </small>
                                    </div>
                                </article>
                            </div>
                        </div>
                    </section>

                    <section
                        className="panel-seccion"
                        aria-labelledby="titulo-usuarios-rol"
                    >
                        <div className="panel-titulo">
                            <div>
                                <p className="panel-etiqueta">Usuarios</p>
                                <h2 id="titulo-usuarios-rol">
                                    Usuarios por rol
                                </h2>
                            </div>
                        </div>

                        <div className="tabla-marco table-responsive">
                            <table className="tabla-panel">
                                <thead>
                                <tr>
                                    <th>Rol</th>
                                    <th>Cantidad</th>
                                </tr>
                                </thead>

                                <tbody>
                                {ROLES_REPORTE.map(([rol, etiqueta]) => (
                                    <tr key={rol}>
                                        <td>{etiqueta}</td>
                                        <td>
                                            {
                                                usuarios.filter(
                                                    (cuenta) =>
                                                        cuenta.rol === rol
                                                ).length
                                            }
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section
                        className="panel-seccion"
                        aria-labelledby="titulo-estados-pedidos"
                    >
                        <div className="panel-titulo">
                            <div>
                                <p className="panel-etiqueta">Pedidos</p>
                                <h2 id="titulo-estados-pedidos">
                                    Estado de los pedidos
                                </h2>
                            </div>
                        </div>

                        <div className="tabla-marco table-responsive">
                            <table className="tabla-panel">
                                <thead>
                                <tr>
                                    <th>Estado</th>
                                    <th>Cantidad</th>
                                </tr>
                                </thead>

                                <tbody>
                                {ESTADOS_REPORTE.map((estado) => (
                                    <tr key={estado}>
                                        <td>{estado}</td>
                                        <td>{pedidosPorEstado[estado]}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}

export default AdminReportes
