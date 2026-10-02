import { useState } from 'react'
import { Link } from 'react-router-dom'
import EtiquetaStock from './EtiquetaStock'

// Tarjeta de un producto. Se usa en el catalogo, en los destacados
// del inicio y en los relacionados del detalle.
//
// Si recibe la prop "alAnadir", muestra el par "Ver" + "Añadir".
// Si no, muestra solo "Ver producto". La tarjeta no sabe nada del
// carrito: solo avisa que alguien hizo clic en "Añadir".

function TarjetaProducto(props) {
  // Texto temporal del boton despues del clic: "Agregado" o "Sin stock"
  const [aviso, setAviso] = useState("")

  const enlace = "/producto/" + props.codigo
  const sinStock = props.stock === 0

  function anadir() {
    const resultado = props.alAnadir()

    setAviso(resultado && resultado.ok === false ? "Sin stock" : "Agregado")
    setTimeout(() => setAviso(""), 1400)
  }

  return (
    <article className="tarjeta-producto">
      <Link className="producto-enlace" to={enlace}>
        <img src={props.imagen} alt={props.nombre} loading="lazy" />
      </Link>

      <div className="tarjeta-contenido">
        <p className="categoria">{props.categoria}</p>
        <h3>{props.nombre}</h3>

        {/* La etiqueta solo aparece si se le paso el stock */}
        {props.stock !== undefined && <EtiquetaStock stock={props.stock} />}

        <p className="precio">{props.precio}</p>

        {props.alAnadir ? (
          <div className="acciones-producto">
            <Link className="btn btn-producto" to={enlace}>Ver</Link>
            <button
              type="button"
              className={aviso === "Agregado" ? "btn btn-anadir btn-anadir-listo" : "btn btn-anadir"}
              disabled={sinStock}
              onClick={anadir}
            >
              {aviso || "Añadir"}
            </button>
          </div>
        ) : (
          <Link className="btn btn-producto" to={enlace}>Ver producto</Link>
        )}
      </div>
    </article>
  );
}

export default TarjetaProducto;
