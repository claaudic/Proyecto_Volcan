import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../contexto/sesionContexto'
import { correoRegistrado, registrarCliente } from '../datos/usuarios'
import { buscarZona } from '../datos/zonas'
import { claseCampo } from '../utilidades/formularios'
import {
  validarTexto,
  validarCorreoCliente,
  validarContrasena,
  validarRepeticion,
  validarTelefono
} from '../utilidades/validaciones'

// Migrado desde registro.html y js/registro.js.

const VACIO = {
  nombre: "",
  apellidos: "",
  correo: "",
  contrasena: "",
  repetir: "",
  telefono: "",
  comuna: "",
  direccion: ""
}

// Regla de cada campo. "repetir" necesita conocer la contrasena,
// por eso recibe todos los datos.
const REGLAS = {
  nombre: (d) => validarTexto(d.nombre, 50, "Ingresa tu nombre."),
  apellidos: (d) => validarTexto(d.apellidos, 100, "Ingresa tus apellidos."),
  correo: (d) => validarCorreoCliente(d.correo),
  contrasena: (d) => validarContrasena(d.contrasena),
  repetir: (d) => validarRepeticion(d.contrasena, d.repetir),
  telefono: (d) => validarTelefono(d.telefono)
}

const COMUNAS = ["Chillán", "Chillán Viejo", "El Carmen", "Pinto", "San Ignacio", "Bulnes", "Quillón"]

function Registro() {
  const [datos, setDatos] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [mostrar, setMostrar] = useState(false)
  const [mensaje, setMensaje] = useState("")

  const { iniciarSesion } = useSesion()
  const navegar = useNavigate()

  // El aviso de cobertura no necesita estado: se calcula desde la comuna escrita
  const zona = buscarZona(datos.comuna)

  // Un solo manejador para todos los campos, como en Contacto
  function cambiar(evento) {
    const { name, value } = evento.target
    const nuevos = { ...datos, [name]: value }

    setDatos(nuevos)
    setMensaje("")

    const cambiosDeError = {}

    if (REGLAS[name]) {
      cambiosDeError[name] = REGLAS[name](nuevos)
    }

    // Si cambia la contrasena y ya se habia repetido, se revisa de nuevo
    if (name === "contrasena" && nuevos.repetir !== "") {
      cambiosDeError.repetir = REGLAS.repetir(nuevos)
    }

    setErrores({ ...errores, ...cambiosDeError })
  }

  function enviar(evento) {
    evento.preventDefault()

    // Al enviar se revisan todos los campos, por si alguno no se toco
    const nuevos = {}
    Object.keys(REGLAS).forEach((campo) => {
      nuevos[campo] = REGLAS[campo](datos)
    })
    setErrores(nuevos)

    const primerError = Object.keys(nuevos).find((campo) => nuevos[campo] !== "")

    if (primerError) {
      evento.target.elements[primerError].focus()
      return
    }

    if (correoRegistrado(datos.correo)) {
      setMensaje("Ese correo ya tiene una cuenta. Inicia sesión o usa otro.")
      setErrores({ ...nuevos, correo: "Este correo ya está registrado." })
      evento.target.elements.correo.focus()
      return
    }

    registrarCliente(datos)

    // La cuenta nueva queda con la sesion iniciada
    iniciarSesion(datos.correo, datos.contrasena)
    navegar("/")
  }

  return (
    <main className="seccion-login">
      <div className="container">
        <div className="login-grid registro-grid">

          <section className="login-presentacion">
            <p className="login-etiqueta">Nueva cuenta</p>
            <h1>Crea tu cuenta de cliente</h1>
            <p className="login-descripcion">
              Con una cuenta puedes guardar tu dirección de despacho
              y revisar el historial de tus pedidos cuando quieras.
            </p>

            <div className="login-separador"></div>

            <ul className="login-puntos">
              {[
                "Tus datos quedan guardados para el próximo pedido.",
                "Revisas el estado y el detalle de cada compra.",
                "Te avisamos si tu comuna está dentro del reparto."
              ].map((texto) => (
                <li key={texto}>
                  <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                    <path d="M4 10.5 L8 14.5 L16 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="login-tarjeta">
            <div className="login-tarjeta-encabezado">
              <img className="login-icono" src="/img/logo.svg" alt="" />
              <h2>Tus datos</h2>
              <p>Los campos con asterisco son obligatorios</p>
            </div>

            <form id="formRegistro" noValidate onSubmit={enviar}>
              <div className="registro-par">
                <div className="login-campo">
                  <label htmlFor="nombre">Nombre <abbr title="obligatorio">*</abbr></label>
                  <input
                    type="text" id="nombre" name="nombre" placeholder="Camila"
                    autoComplete="given-name" maxLength="50" required
                    value={datos.nombre} onChange={cambiar}
                    className={claseCampo(datos.nombre, errores.nombre)}
                  />
                  <small className="mensaje-error-campo" role="status">{errores.nombre}</small>
                </div>

                <div className="login-campo">
                  <label htmlFor="apellidos">Apellidos <abbr title="obligatorio">*</abbr></label>
                  <input
                    type="text" id="apellidos" name="apellidos" placeholder="Rojas Díaz"
                    autoComplete="family-name" maxLength="100" required
                    value={datos.apellidos} onChange={cambiar}
                    className={claseCampo(datos.apellidos, errores.apellidos)}
                  />
                  <small className="mensaje-error-campo" role="status">{errores.apellidos}</small>
                </div>
              </div>

              <div className="login-campo">
                <label htmlFor="correo">Correo electrónico <abbr title="obligatorio">*</abbr></label>
                <input
                  type="email" id="correo" name="correo" placeholder="nombre@gmail.com"
                  autoComplete="email" maxLength="100" required
                  value={datos.correo} onChange={cambiar}
                  className={claseCampo(datos.correo, errores.correo)}
                />
                <small className="mensaje-ayuda">Usa tu correo personal. Las cuentas del equipo las crea el administrador.</small>
                <small className="mensaje-error-campo" role="status">{errores.correo}</small>
              </div>

              <div className="login-campo">
                <label htmlFor="contrasena">Contraseña <abbr title="obligatorio">*</abbr></label>
                <div className="contenedor-contrasena">
                  <input
                    type={mostrar ? "text" : "password"} id="contrasena" name="contrasena"
                    placeholder="Crea una contraseña" autoComplete="new-password" maxLength="10" required
                    value={datos.contrasena} onChange={cambiar}
                    className={claseCampo(datos.contrasena, errores.contrasena)}
                  />
                  <button type="button" className="mostrar-contrasena" onClick={() => setMostrar(!mostrar)}>
                    {mostrar ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <small className="mensaje-ayuda">Entre 4 y 10 caracteres</small>
                <small className="mensaje-error-campo" role="status">{errores.contrasena}</small>
              </div>

              <div className="login-campo">
                <label htmlFor="repetir">Repite la contraseña <abbr title="obligatorio">*</abbr></label>
                <input
                  type="password" id="repetir" name="repetir" placeholder="Escríbela otra vez"
                  autoComplete="new-password" maxLength="10" required
                  value={datos.repetir} onChange={cambiar}
                  className={claseCampo(datos.repetir, errores.repetir)}
                />
                <small className="mensaje-error-campo" role="status">{errores.repetir}</small>
              </div>

              <div className="registro-par">
                <div className="login-campo">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="tel" id="telefono" name="telefono" placeholder="+56 9 1234 5678"
                    autoComplete="tel" maxLength="15"
                    value={datos.telefono} onChange={cambiar}
                    className={claseCampo(datos.telefono, errores.telefono)}
                  />
                  <small className="mensaje-error-campo" role="status">{errores.telefono}</small>
                </div>

                <div className="login-campo">
                  <label htmlFor="comuna">Comuna</label>
                  <input
                    type="text" id="comuna" name="comuna" list="comunasRegistro"
                    placeholder="Chillán" maxLength="60"
                    value={datos.comuna} onChange={cambiar}
                  />
                  <datalist id="comunasRegistro">
                    {COMUNAS.map((comuna) => <option key={comuna} value={comuna} />)}
                  </datalist>

                  {/* Avisa, pero no impide registrarse */}
                  {datos.comuna.trim() !== "" && (
                    <small className={zona ? "mensaje-ayuda aviso-cobertura-ok" : "mensaje-ayuda aviso-cobertura-no"}>
                      {zona
                        ? "Llegamos a tu comuna: " + zona.zona + "."
                        : "Todavía no tenemos reparto en esa comuna."}
                    </small>
                  )}
                </div>
              </div>

              <div className="login-campo">
                <label htmlFor="direccion">Dirección de despacho</label>
                <input
                  type="text" id="direccion" name="direccion" placeholder="Calle y número"
                  autoComplete="street-address" maxLength="300"
                  value={datos.direccion} onChange={cambiar}
                />
              </div>

              {mensaje && <div className="mensaje-login" role="alert">{mensaje}</div>}

              <button type="submit" className="btn btn-principal boton-login">Crear mi cuenta</button>
            </form>

            <p className="login-registro">
              ¿Ya tienes una cuenta?{" "}
              <Link to="/login">Iniciar sesión</Link>
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}

export default Registro
