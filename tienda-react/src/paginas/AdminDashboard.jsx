import { Link } from 'react-router-dom'

function AdminDashboard() {
    return (
        <main className="admin-layout">

            <aside className="admin-sidebar">
                <div className="admin-sidebar-titulo">
                    <span className="admin-sidebar-etiqueta">ADMIN</span>
                    <h2>Gas El Volcán</h2>
                </div>

                <nav className="admin-menu" aria-label="Menú de administración">
                    <Link to="/admin" className="admin-menu-link activo">
                        Inicio
                    </Link>

                    <Link to="/admin/productos" className="admin-menu-link">
                        Productos
                    </Link>

                    <Link to="/admin/usuarios" className="admin-menu-link">
                        Usuarios
                    </Link>

                    <Link to="/admin/ordenes" className="admin-menu-link">
                        Órdenes
                    </Link>

                    <Link to="/admin/reportes" className="admin-menu-link">
                        Reportes
                    </Link>
                </nav>
            </aside>

            <section className="admin-contenido">

                <header className="admin-cabecera">
                    <div>
                        <span className="admin-superior">Administración</span>

                        <h1>Panel de administración</h1>

                        <p>
                            Revisa el estado general de la tienda y accede a las
                            herramientas de gestión.
                        </p>
                    </div>
                </header>

                <section className="admin-indicadores">

                    <article className="admin-indicador">
            <span className="admin-indicador-titulo">
              Pedidos pendientes
            </span>

                        <strong className="admin-indicador-numero">
                            0
                        </strong>

                        <span className="admin-indicador-detalle">
              Pedidos por gestionar
            </span>
                    </article>

                    <article className="admin-indicador">
            <span className="admin-indicador-titulo">
              Sin repartidor
            </span>

                        <strong className="admin-indicador-numero">
                            0
                        </strong>

                        <span className="admin-indicador-detalle">
              Requieren asignación
            </span>
                    </article>

                    <article className="admin-indicador">
            <span className="admin-indicador-titulo">
              Producto con menor stock
            </span>

                        <strong className="admin-indicador-producto">
                            Sin datos
                        </strong>

                        <span className="admin-indicador-detalle">
              Stock disponible
            </span>
                    </article>

                    <article className="admin-indicador">
            <span className="admin-indicador-titulo">
              Total vendido
            </span>

                        <strong className="admin-indicador-numero">
                            $0
                        </strong>

                        <span className="admin-indicador-detalle">
              Ventas registradas
            </span>
                    </article>

                </section>

                <section className="admin-seccion">
                    <div className="admin-seccion-cabecera">
                        <div>
              <span className="admin-superior">
                Accesos rápidos
              </span>

                            <h2>Gestión de la tienda</h2>
                        </div>
                    </div>

                    <div className="admin-accesos">

                        <Link to="/admin/productos" className="admin-acceso">
                            <span className="admin-acceso-numero">01</span>

                            <div>
                                <strong>Productos</strong>
                                <p>
                                    Administra el catálogo, precios y stock.
                                </p>
                            </div>
                        </Link>

                        <Link to="/admin/usuarios" className="admin-acceso">
                            <span className="admin-acceso-numero">02</span>

                            <div>
                                <strong>Usuarios</strong>
                                <p>
                                    Gestiona clientes y trabajadores.
                                </p>
                            </div>
                        </Link>

                        <Link to="/admin/ordenes" className="admin-acceso">
                            <span className="admin-acceso-numero">03</span>

                            <div>
                                <strong>Órdenes</strong>
                                <p>
                                    Revisa pedidos y estados de entrega.
                                </p>
                            </div>
                        </Link>

                        <Link to="/admin/reportes" className="admin-acceso">
                            <span className="admin-acceso-numero">04</span>

                            <div>
                                <strong>Reportes</strong>
                                <p>
                                    Consulta información y estadísticas.
                                </p>
                            </div>
                        </Link>

                    </div>
                </section>

            </section>
        </main>
    )
}

export default AdminDashboard