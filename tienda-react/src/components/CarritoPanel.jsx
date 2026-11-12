import { Link } from "react-router-dom";
import { useCarrito } from "../contexto/carritoContexto";
import { formatearPrecio, imagenDe } from "../datos/productos";
import { usarImagenRespaldo } from "../utilidades/imagenes";
import { cerrarPanelCarrito } from "../utilidades/panelCarrito";
import { SIN_CONEXION } from "../utilidades/api";

// Panel lateral del carrito (offcanvas de Bootstrap).
// Migrado desde js/carrito-panel.js. El boton "Carrito" del navbar
// lo abre con data-bs-target="#panelCarrito".

function CarritoPanel() {
  const { detalle, items, productos = [], estado, puedeConfirmar, errorCatalogo, cambiarCantidad, quitar, vaciar } = useCarrito();
  const vacio = items.length === 0;
  const pendiente = estado === 'cargando' || estado === 'error';
  // Conserva cada artículo y la estructura original, sin inventar importes.
  const lineas = puedeConfirmar ? detalle.lineas : items.map(item => {
    const producto = productos.find(p => p.codigo === item.codigo);
    return { codigo: item.codigo, nombre: producto?.nombre ?? item.codigo,
      imagen: producto?.imagen ?? '', cantidad: item.cantidad, stock: producto?.stock ?? 0,
      conocido: Boolean(producto), precio: null, subtotal: null };
  });
  const excedida = lineas.find(linea => linea.conocido && linea.stock > 0 && linea.cantidad > linea.stock);
  const sinStock = lineas.some(linea => !linea.conocido || linea.stock === 0);
  const aviso = estado === 'error'
    ? (errorCatalogo === SIN_CONEXION ? SIN_CONEXION : 'Ocurrió un error inesperado. Intenta de nuevo.')
    : excedida ? (excedida.stock === 1 ? 'Solo queda 1 unidad disponible.' : 'Solo quedan ' + excedida.stock + ' unidades disponibles.')
      : sinStock ? 'Este producto no tiene stock disponible.' : 'Ocurrió un error inesperado. Intenta de nuevo.';

  return (
    <div
      className="offcanvas offcanvas-end panel-carrito"
      id="panelCarrito"
      tabIndex="-1"
      aria-labelledby="tituloPanelCarrito"
    >
      <div className="offcanvas-header panel-cabecera">
        <h2 className="offcanvas-title" id="tituloPanelCarrito">Mi carrito</h2>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
      </div>

      <div className="offcanvas-body panel-cuerpo" aria-busy={!vacio && estado === 'cargando' ? true : undefined}>
        {!vacio && estado === 'cargando' && <p className="visually-hidden" role="status">Comprobando precios y stock del carrito...</p>}
        {!vacio && (estado === 'error' || estado === 'no-disponible') && <p className="panel-nota" role="alert">{aviso}</p>}
        {vacio ? (
          <div className="panel-vacio">
            <p className="panel-vacio-titulo">Tu carrito está vacío</p>
            <p>Agrega productos desde el catálogo.</p>
            <Link className="btn btn-principal" to="/productos" onClick={cerrarPanelCarrito}>
              Ver el catálogo
            </Link>
          </div>
        ) : (
          <ul className="panel-lista list-unstyled">
            {lineas.map((linea) => (
              <li key={linea.codigo} className="panel-item">
                <img src={imagenDe(linea)} alt={linea.nombre} onError={usarImagenRespaldo} />

                <div className="panel-datos">
                  <h3>{linea.nombre}</h3>
                  <p className="panel-unidad">{linea.precio === null ? '—' : formatearPrecio(linea.precio)} c/u</p>

                  <div className="panel-controles">
                    <button
                      type="button"
                      className="paso"
                      aria-label="Quitar una unidad"
                      disabled={pendiente || !Number.isSafeInteger(linea.cantidad) || linea.cantidad <= 1 || (!puedeConfirmar && !linea.conocido)}
                      onClick={() => cambiarCantidad(linea.codigo, linea.cantidad - 1)}
                    >
                      −
                    </button>

                    <span className="cantidad-valor">{linea.cantidad}</span>

                    <button
                      type="button"
                      className="paso"
                      aria-label="Agregar una unidad"
                      disabled={pendiente || !Number.isSafeInteger(linea.cantidad) || linea.cantidad < 1 || linea.cantidad >= linea.stock}
                      onClick={() => cambiarCantidad(linea.codigo, linea.cantidad + 1)}
                    >
                      +
                    </button>

                    <button type="button" className="enlace-quitar" onClick={() => quitar(linea.codigo)}>
                      Quitar
                    </button>
                  </div>
                </div>

                <strong className="panel-subtotal">{linea.subtotal === null ? '—' : formatearPrecio(linea.subtotal)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!vacio && (
        <div className="panel-pie">
          <p className="panel-total">
            <span>Total</span>
            <strong>{detalle.total === null ? '—' : formatearPrecio(detalle.total)}</strong>
          </p>
          <p className="panel-nota">El despacho se coordina al confirmar el pedido.</p>

          {/* Cierra el panel y deja que Link navegue al checkout */}
          <Link className="btn btn-principal boton-ancho" to="/checkout"
            aria-disabled={!puedeConfirmar || undefined} tabIndex={puedeConfirmar ? undefined : -1}
            onClick={evento => {
              if (!puedeConfirmar) { evento.preventDefault(); return; }
              cerrarPanelCarrito();
            }}>
            Pagar
          </Link>

          <button type="button" className="enlace-vaciar" onClick={vaciar}>
            Vaciar carrito
          </button>
        </div>
      )}
    </div>
  );
}

export default CarritoPanel;
