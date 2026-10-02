import { Link } from "react-router-dom";
import { useCarrito } from "../contexto/carritoContexto";
import { formatearPrecio, imagenDe } from "../datos/productos";

// Panel lateral del carrito (offcanvas de Bootstrap).
// Migrado desde js/carrito-panel.js. El boton "Carrito" del navbar
// lo abre con data-bs-target="#panelCarrito".

function CarritoPanel() {
  const { detalle, cambiarCantidad, quitar, vaciar } = useCarrito();
  const vacio = detalle.lineas.length === 0;

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

      <div className="offcanvas-body panel-cuerpo">
        {vacio ? (
          <div className="panel-vacio">
            <p className="panel-vacio-titulo">Tu carrito está vacío</p>
            <p>Agrega productos desde el catálogo.</p>
            <Link className="btn btn-principal" to="/productos" data-bs-dismiss="offcanvas">
              Ver el catálogo
            </Link>
          </div>
        ) : (
          <ul className="panel-lista list-unstyled">
            {detalle.lineas.map((linea) => (
              <li key={linea.codigo} className="panel-item">
                <img src={imagenDe(linea.codigo)} alt={linea.nombre} />

                <div className="panel-datos">
                  <h3>{linea.nombre}</h3>
                  <p className="panel-unidad">{formatearPrecio(linea.precio)} c/u</p>

                  <div className="panel-controles">
                    <button
                      type="button"
                      className="paso"
                      aria-label="Quitar una unidad"
                      disabled={linea.cantidad <= 1}
                      onClick={() => cambiarCantidad(linea.codigo, linea.cantidad - 1)}
                    >
                      −
                    </button>

                    <span className="cantidad-valor">{linea.cantidad}</span>

                    <button
                      type="button"
                      className="paso"
                      aria-label="Agregar una unidad"
                      disabled={linea.cantidad >= linea.stock}
                      onClick={() => cambiarCantidad(linea.codigo, linea.cantidad + 1)}
                    >
                      +
                    </button>

                    <button type="button" className="enlace-quitar" onClick={() => quitar(linea.codigo)}>
                      Quitar
                    </button>
                  </div>
                </div>

                <strong className="panel-subtotal">{formatearPrecio(linea.subtotal)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!vacio && (
        <div className="panel-pie">
          <p className="panel-total">
            <span>Total</span>
            <strong>{formatearPrecio(detalle.total)}</strong>
          </p>
          <p className="panel-nota">El despacho se coordina al confirmar el pedido.</p>

          {/* El boton "Pagar" se agrega cuando exista la vista de Checkout */}

          <button type="button" className="enlace-vaciar" onClick={vaciar}>
            Vaciar carrito
          </button>
        </div>
      )}
    </div>
  );
}

export default CarritoPanel;
