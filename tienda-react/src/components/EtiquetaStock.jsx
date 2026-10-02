// Etiqueta de disponibilidad. Se usa en la tarjeta del catalogo
// y en el detalle del producto, por eso es un componente aparte.
// Mismas reglas que el sitio en HTML.

function EtiquetaStock({ stock }) {
  if (stock === 0) {
    return <span className="stock stock-agotado">Sin stock</span>
  }

  if (stock <= 20) {
    return <span className="stock stock-bajo">Últimas {stock} unidades</span>
  }

  return <span className="stock stock-ok">En stock</span>
}

export default EtiquetaStock
