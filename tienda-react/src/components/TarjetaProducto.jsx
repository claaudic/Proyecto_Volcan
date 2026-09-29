function TarjetaProducto(props) {
  return (
    <article className="tarjeta-producto">
      <img src={props.imagen} alt={props.nombre} loading="lazy" />

      <div className="tarjeta-contenido">
        <p className="categoria">{props.categoria}</p>
        <h3>{props.nombre}</h3>
        <p className="precio">{props.precio}</p>
      </div>
    </article>
  );
}

export default TarjetaProducto;
