import { Link } from 'react-router-dom'

// Tarjeta de una categoria en la portada de Categorias.
// Usa el mismo estilo de la tarjeta de producto para que el sitio se vea parejo.

function TarjetaCategoria({ nombre, imagen, cantidad, enlace }) {
  return (
    <article className="tarjeta-producto tarjeta-categoria">
      <Link className="producto-enlace" to={enlace}>
        <img src={imagen} alt="" loading="lazy" />
      </Link>

      <div className="tarjeta-contenido">
        <p className="categoria">{cantidad === 1 ? "1 producto" : cantidad + " productos"}</p>
        <h3>{nombre}</h3>
        <Link className="btn btn-producto" to={enlace}>Ver categoría</Link>
      </div>
    </article>
  )
}

export default TarjetaCategoria
