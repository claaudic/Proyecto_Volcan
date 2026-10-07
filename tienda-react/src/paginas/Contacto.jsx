import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  validarNombre,
  validarCorreo,
  validarComentario
} from '../utilidades/validaciones'
import { claseCampo } from '../utilidades/formularios'

// Migrado desde contacto.html del sitio en HTML.
// La validacion que antes hacia js/contacto.js ahora vive en el estado del componente.

const VACIO = { nombre: "", correo: "", asunto: "", comentario: "" }

// Que funcion valida cada campo. El asunto es opcional y no se valida.
const REGLAS = {
  nombre: validarNombre,
  correo: validarCorreo,
  comentario: validarComentario
}


function Contacto() {
  const [datos, setDatos] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [exito, setExito] = useState("")

  // Un solo manejador para todos los campos: usa el atributo name del input
  function cambiar(evento) {
    const { name, value } = evento.target

    setDatos({ ...datos, [name]: value })
    setExito("")

    // Validacion en vivo, mientras la persona escribe
    if (REGLAS[name]) {
      setErrores({ ...errores, [name]: REGLAS[name](value) })
    }
  }

  function enviar(evento) {
    evento.preventDefault()

    // Al enviar se valida todo de nuevo, por si algun campo no se toco
    const nuevos = {
      nombre: validarNombre(datos.nombre),
      correo: validarCorreo(datos.correo),
      comentario: validarComentario(datos.comentario)
    }
    setErrores(nuevos)

    const primerError = Object.keys(nuevos).find((campo) => nuevos[campo] !== "")

    if (primerError) {
      evento.target.elements[primerError].focus()
      return
    }

    const primerNombre = datos.nombre.trim().split(" ")[0]
    setExito(
      "Gracias " + primerNombre +
      ", recibimos tu mensaje. Te respondemos dentro de las próximas horas hábiles."
    )
    setDatos(VACIO)
    setErrores({})
  }

  // El contador no necesita estado propio: se calcula desde el texto
  const usados = datos.comentario.length

  return (
    <main>
      <section className="pagina-encabezado" aria-labelledby="titulo-contacto">
        <div className="encabezado-fondo" aria-hidden="true">
          <span className="luz luz-encabezado-verde"></span>
          <span className="luz luz-encabezado-celeste"></span>
          <span className="encabezado-arco"></span>
        </div>

        <div className="container">
          <nav className="miga" aria-label="Ruta">
            <Link to="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Contacto</span>
          </nav>
          <h1 id="titulo-contacto">Escríbenos</h1>
          <p className="pagina-bajada">Cuéntanos qué necesitas y te respondemos a la brevedad.</p>
        </div>

        <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
        </svg>
      </section>

      <section className="contacto" aria-labelledby="titulo-formulario">
        <div className="container contacto-grid" data-revelar>

          <div className="tarjeta-panel">
            <h2 id="titulo-formulario">Formulario de contacto</h2>
            <p className="panel-bajada">Todos los campos marcados con asterisco son obligatorios.</p>

            <form id="formContacto" noValidate onSubmit={enviar}>
              <div className="campo">
                <label htmlFor="nombre">Nombre <abbr title="obligatorio">*</abbr></label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  autoComplete="name"
                  maxLength="100"
                  placeholder="Tu nombre completo"
                  required
                  value={datos.nombre}
                  onChange={cambiar}
                  className={claseCampo(datos.nombre, errores.nombre)}
                />
                <small className="mensaje-error-campo" role="status">{errores.nombre}</small>
              </div>

              <div className="campo">
                <label htmlFor="correo">Correo electrónico <abbr title="obligatorio">*</abbr></label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  autoComplete="email"
                  maxLength="100"
                  placeholder="nombre@gmail.com"
                  required
                  value={datos.correo}
                  onChange={cambiar}
                  className={claseCampo(datos.correo, errores.correo)}
                />
                <small className="mensaje-error-campo" role="status">{errores.correo}</small>
              </div>

              <div className="campo">
                <label htmlFor="asunto">Asunto</label>
                <input
                  type="text"
                  id="asunto"
                  name="asunto"
                  maxLength="100"
                  placeholder="Sobre qué nos escribes"
                  list="asuntosFrecuentes"
                  value={datos.asunto}
                  onChange={cambiar}
                />
                <datalist id="asuntosFrecuentes">
                  <option value="Consulta por un pedido"></option>
                  <option value="Cobertura en mi comuna"></option>
                  <option value="Precios y disponibilidad"></option>
                  <option value="Cuenta comercial"></option>
                </datalist>
              </div>

              <div className="campo">
                <label htmlFor="comentario">Mensaje <abbr title="obligatorio">*</abbr></label>
                <textarea
                  id="comentario"
                  name="comentario"
                  rows="6"
                  maxLength="500"
                  placeholder="Cuéntanos qué necesitas"
                  required
                  value={datos.comentario}
                  onChange={cambiar}
                  className={claseCampo(datos.comentario, errores.comentario)}
                ></textarea>
                <div className="campo-pie">
                  <small className="mensaje-error-campo" role="status">{errores.comentario}</small>
                  <small className={usados > 450 ? "contador contador-alerta" : "contador"}>
                    {usados} / 500
                  </small>
                </div>
              </div>

              {exito && (
                <div className="mensaje-exito" role="alert">{exito}</div>
              )}

              <button type="submit" className="btn btn-principal">Enviar mensaje</button>
            </form>
          </div>

          <aside className="contacto-lateral">
            <div className="tarjeta-panel">
              <h2>Datos de la distribuidora</h2>
              <ul className="pie-contacto lista-datos">
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span>Chillán, Región de Ñuble</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M5 4h4l2 5-2.5 1.5a12 12 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  <a href="tel:+56973214560">+56 9 7321 4560</a>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                  <a href="mailto:contacto@gaselvolcan.cl">contacto@gaselvolcan.cl</a>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Lunes a sábado, 08:00 a 20:00</span>
                </li>
              </ul>
            </div>

            <div className="tarjeta-panel">
              <h2>¿Prefieres pedir directamente?</h2>
              <p className="panel-bajada">Revisa el catálogo y coordina tu despacho.</p>
              <Link className="btn btn-principal boton-ancho" to="/productos">Ver productos</Link>
            </div>
          </aside>

        </div>
      </section>
    </main>
  )
}

export default Contacto
