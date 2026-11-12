import { Link, useLocation } from 'react-router-dom'
import { formatearPrecio } from '../datos/productos'

// Camión que llega con los cilindros frente al volcán. Es solo decoración (aria-hidden):
// la información importante está en el texto de la página.
function CamionReparto() {
    const rueda = (x) => (
        <g className="camion-rueda">
            <circle cx={x} cy="130" r="17" fill="#12303a" />
            <circle cx={x} cy="130" r="7" fill="#d9e5e7" />
            <rect x={x - 2} y="115" width="4" height="30" fill="#6b7d84" />
        </g>
    )
    const nube = 'M14 30 Q0 30 2 20 Q4 10 16 12 Q20 0 36 4 Q46 -2 56 8 Q72 4 76 16 Q90 18 86 28 Q84 32 76 30 Z'

    return (
        <div className="camion-escena" aria-hidden="true">
            {/* Paisaje: volcán nevado (como los Nevados de Chillán), cerros y calle */}
            <svg className="camion-paisaje" viewBox="0 0 800 240" preserveAspectRatio="xMidYMax slice" focusable="false">
                <path className="paisaje-volcan" d="M300 200 L430 70 Q440 60 452 66 L470 78 Q480 70 490 78 L620 200 Z" />
                <path className="paisaje-sombra" d="M461 72 L470 78 Q480 70 490 78 L620 200 L520 200 Z" />
                <path fill="#ffffff" d="M430 70 Q440 60 452 66 L470 78 Q480 70 490 78 L512 100 Q500 96 492 104 Q484 94 474 102 Q466 92 456 100 Q446 92 438 100 Q430 94 418 98 Z" />
                <path className="paisaje-cerro" d="M0 200 Q90 140 190 180 Q260 150 340 196 L0 210 Z" />
                <path className="paisaje-cerro" d="M520 205 Q620 150 720 175 Q770 160 800 170 L800 210 Z" />
                <rect className="paisaje-pasto" x="0" y="196" width="800" height="12" />
                <rect className="paisaje-calle" x="0" y="208" width="800" height="32" />
            </svg>
            <svg className="camion-nube camion-nube-1" viewBox="0 0 90 34" focusable="false"><path d={nube} /></svg>
            <svg className="camion-nube camion-nube-2" viewBox="0 0 90 34" focusable="false"><path d={nube} /></svg>
            <div className="camion-camino"></div>

            <div className="camion">
                <svg viewBox="0 0 280 154" focusable="false">
                    <defs>
                        <linearGradient id="camion-haz" x1="0" x2="1">
                            <stop offset="0" stopColor="#ffd27a" stopOpacity=".9" />
                            <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path className="camion-foco" d="M254 96 L300 84 L300 114 Z" fill="url(#camion-haz)" />
                    <g className="camion-humo">
                        <circle cx="10" cy="106" r="8" />
                        <circle cx="10" cy="106" r="8" />
                        <circle cx="10" cy="106" r="8" />
                    </g>
                    <ellipse cx="140" cy="148" rx="122" ry="5" fill="#12303a" opacity=".12" />
                    <g className="camion-carroceria">
                        <rect x="8" y="107" width="16" height="6" rx="3" fill="#6b7d84" />
                        {/* caja con tres cilindros */}
                        <rect x="18" y="22" width="152" height="90" rx="10" fill="#0e9f6e" />
                        <rect x="18" y="22" width="152" height="10" rx="5" fill="#0b8a5f" />
                        <rect x="28" y="34" width="132" height="56" rx="6" fill="#ffffff" opacity=".92" />
                        <rect x="28" y="60" width="132" height="3" fill="#0e9f6e" opacity=".35" />
                        <rect x="35" y="44" width="34" height="46" rx="14" fill="#38bdf8" />
                        <rect x="45" y="36" width="14" height="10" rx="3" fill="#12303a" />
                        <rect x="40" y="52" width="6" height="26" rx="3" fill="#ffffff" opacity=".45" />
                        <rect x="77" y="44" width="34" height="46" rx="14" fill="#db2777" />
                        <rect x="87" y="36" width="14" height="10" rx="3" fill="#12303a" />
                        <rect x="82" y="52" width="6" height="26" rx="3" fill="#ffffff" opacity=".45" />
                        <rect x="119" y="44" width="34" height="46" rx="14" fill="#38bdf8" />
                        <rect x="129" y="36" width="14" height="10" rx="3" fill="#12303a" />
                        <rect x="124" y="52" width="6" height="26" rx="3" fill="#ffffff" opacity=".45" />
                        {/* franja con el nombre */}
                        <rect x="18" y="94" width="152" height="18" rx="4" fill="#12303a" />
                        <text x="94" y="107" textAnchor="middle" fontWeight="800" fontSize="11" fill="#ffffff" letterSpacing="1">
                            GAS EL VOLCÁN
                        </text>
                        {/* cabina: ventana, puerta, manilla, espejo, logo, foco y parachoques */}
                        <path d="M174 40 h46 q9 0 14 7 l20 29 q4 5 4 11 v25 h-84 z" fill="#12303a" />
                        <path d="M184 48 h33 q5 0 8 4 l16 23 h-57 z" fill="#bfeafc" />
                        <path d="M190 52 l10 0 l-10 14 z" fill="#ffffff" opacity=".5" />
                        <path d="M184 80 v30" stroke="#1d4a58" strokeWidth="2" />
                        <rect x="214" y="86" width="10" height="3" rx="1.5" fill="#6b7d84" />
                        <rect x="176" y="50" width="4" height="16" rx="2" fill="#12303a" />
                        <rect x="170" y="52" width="7" height="10" rx="2" fill="#1d4a58" />
                        <path d="M198 112 q19 -14 38 0" fill="#1d4a58" />
                        <path d="M190 98 l10 -16 l7 9 l5 -6 l10 13 z" fill="#38bdf8" />
                        <rect x="246" y="92" width="12" height="8" rx="3" fill="#ffd27a" />
                        <rect x="244" y="108" width="18" height="6" rx="3" fill="#6b7d84" />
                    </g>
                    {rueda(59)}
                    {rueda(131)}
                    {rueda(217)}
                </svg>
            </div>

            <div className="camion-burbuja"><span>✓</span>¡Pedido recibido!</div>
        </div>
    )
}

// "2026-11-12T11:00:00" -> "12-11-2026, 11:00"
function formatearFecha(fecha) {
    const valor = new Date(fecha)

    if (!fecha || Number.isNaN(valor.getTime())) {
        return ''
    }

    return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(valor)
}

// 5 -> "000005"
function numeroComprobante(numero) {
    return String(numero).padStart(6, '0')
}

// Lo que sale al "Descargar comprobante". En pantalla está oculto;
// al imprimir (o guardar como PDF) es lo único que se ve.
function Comprobante({ pedido }) {
    return (
        <article className="comprobante" aria-label={`Comprobante del pedido ${pedido.numero}`}>
            <header className="comprobante-cabeza">
                <svg viewBox="0 0 54 36" aria-hidden="true" focusable="false">
                    <path d="M2 34 L20 6 L30 20 L37 11 L52 34 Z" fill="#0e9f6e" />
                    <path d="M20 6 L30 20 L24 20 L20 14 Z" fill="#38bdf8" />
                    <path d="M16 12 L20 6 L24 12 Z" fill="#ffffff" />
                </svg>
                <div>
                    <strong className="comprobante-marca">GAS EL VOLCÁN</strong>
                    <small>Distribuidora de gas licuado · Chillán, Región de Ñuble</small>
                </div>
            </header>

            <div className="comprobante-titulo">
                <div>
                    <span className="comprobante-etiqueta">Comprobante de pedido</span>
                    <span className="comprobante-numero">N° {numeroComprobante(pedido.numero)}</span>
                </div>
                <div className="comprobante-fecha">
                    {formatearFecha(pedido.fecha)}
                    <span className="compra-exitosa-estado">Pendiente de despacho</span>
                </div>
            </div>

            <table className="comprobante-tabla">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th className="derecha">Cant.</th>
                        <th className="derecha">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {pedido.productos.map((producto) => (
                        <tr key={producto.codigo}>
                            <td>
                                {producto.nombre}
                                {producto.precio !== undefined && <small>{formatearPrecio(producto.precio)} c/u</small>}
                            </td>
                            <td className="derecha">{producto.cantidad}</td>
                            <td className="derecha">{formatearPrecio(producto.subtotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="comprobante-total">
                <span>Total pagado</span>
                <strong>{formatearPrecio(pedido.total)}</strong>
            </div>

            <div className="comprobante-datos">
                {pedido.cliente && (
                    <div>
                        <span className="comprobante-etiqueta">Cliente</span>
                        <p>
                            {pedido.cliente.nombre}<br />
                            {pedido.cliente.correo}
                            {pedido.cliente.telefono && <><br />{pedido.cliente.telefono}</>}
                        </p>
                    </div>
                )}
                <div>
                    <span className="comprobante-etiqueta">Entrega</span>
                    <p>{pedido.entrega.direccion}<br />{pedido.entrega.comuna}</p>
                </div>
                {pedido.pago && (
                    <div>
                        <span className="comprobante-etiqueta">Pago</span>
                        <p>Tarjeta {pedido.pago.tarjeta}</p>
                    </div>
                )}
                <div>
                    <span className="comprobante-etiqueta">Reparto</span>
                    <p>En el día de reparto de tu comuna</p>
                </div>
            </div>

            <p className="comprobante-gracias">¡Gracias por preferirnos!</p>
            <p className="comprobante-nota">
                Comprobante del pedido en la tienda en línea. No reemplaza a la boleta electrónica.
            </p>
        </article>
    )
}

// El navegador usa el título de la página como nombre del PDF:
// se cambia solo mientras se imprime y después se deja como estaba.
function descargarComprobante(pedido) {
    const tituloOriginal = document.title
    document.title = `Comprobante pedido ${numeroComprobante(pedido.numero)} - Gas El Volcán`
    window.print()
    document.title = tituloOriginal
}

function CompraExitosa() {
    const location = useLocation()
    const pedido = location.state?.pedido

    if (!pedido) {
        return (
            <main className="container py-5">
                <section className="compra-exitosa">
                    <div className="compra-exitosa-icono">!</div>

                    <h1>No hay información de la compra</h1>

                    <p className="text-muted">
                        No se encontró un pedido reciente para mostrar.
                    </p>

                    <Link to="/productos" className="btn btn-principal mt-3">
                        Volver al catálogo
                    </Link>
                </section>
            </main>
        )
    }

    return (
        <main className="container py-5">
            <section className="compra-exitosa">
                <CamionReparto />

                {/* Estado real de la boleta: recién creada siempre queda PENDIENTE */}
                <span className="compra-exitosa-estado">● Pendiente de despacho</span>

                <h1>Compra realizada con éxito</h1>

                <p className="text-muted">
                    ¡Gracias por tu compra! Estamos preparando tu pedido y te lo llevamos
                    en el día de reparto de tu comuna.
                </p>

                <div className="compra-exitosa-numero">
                    Pedido <strong>#{pedido.numero}</strong>
                    {formatearFecha(pedido.fecha) && <span> · {formatearFecha(pedido.fecha)}</span>}
                </div>

                <div className="compra-exitosa-contenido">
                    <div>
                        <h2 className="h4 mb-3">Resumen del pedido</h2>

                        {pedido.productos.map((producto) => (
                            <div
                                key={producto.codigo}
                                className="compra-exitosa-producto"
                            >
                                <div>
                                    <strong>{producto.nombre}</strong>

                                    <div className="text-muted small">
                                        Cantidad: {producto.cantidad}
                                    </div>
                                </div>

                                <strong>
                                    {formatearPrecio(producto.subtotal)}
                                </strong>
                            </div>
                        ))}

                        <div className="compra-exitosa-total">
                            <span>Total pagado</span>
                            <strong>{formatearPrecio(pedido.total)}</strong>
                        </div>
                    </div>

                    <div>
                        {/* Datos de quien compro (Figura 7 de las instrucciones) */}
                        {pedido.cliente && (
                            <>
                                <h2 className="h4 mb-3">Datos del comprador</h2>

                                <dl className="compra-exitosa-datos">
                                    <dt>Nombre</dt>
                                    <dd>{pedido.cliente.nombre}</dd>

                                    <dt>Correo</dt>
                                    <dd>{pedido.cliente.correo}</dd>

                                    {pedido.cliente.telefono && (
                                        <>
                                            <dt>Teléfono</dt>
                                            <dd>{pedido.cliente.telefono}</dd>
                                        </>
                                    )}

                                    {pedido.pago && (
                                        <>
                                            <dt>Pagado con</dt>
                                            <dd>Tarjeta {pedido.pago.tarjeta}</dd>
                                        </>
                                    )}
                                </dl>
                            </>
                        )}

                        <h2 className="h4 mb-3">Dirección de entrega</h2>

                        <p className="mb-1">
                            <strong>{pedido.entrega.direccion}</strong>
                        </p>

                        <p className="text-muted mb-2">
                            {pedido.entrega.comuna}
                        </p>

                        {pedido.entrega.indicaciones && (
                            <p className="text-muted">
                                Indicaciones: {pedido.entrega.indicaciones}
                            </p>
                        )}
                    </div>
                </div>

                <div className="compra-exitosa-acciones">
                    {/* Abre la ventana de imprimir: ahí se puede "Guardar como PDF" */}
                    <button type="button" className="btn btn-principal" onClick={() => descargarComprobante(pedido)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 3v12" />
                            <path d="m7 10 5 5 5-5" />
                            <path d="M5 21h14" />
                        </svg>
                        Descargar comprobante
                    </button>
                    <Link to="/productos" className="btn btn-secundario">
                        Volver al catálogo
                    </Link>
                </div>
            </section>

            <Comprobante pedido={pedido} />
        </main>
    )
}

export default CompraExitosa