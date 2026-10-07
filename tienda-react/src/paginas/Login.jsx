import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../contexto/sesionContexto'
import { validarCorreo, validarContrasena } from '../utilidades/validaciones'
import { claseCampo } from '../utilidades/formularios'

// Migrado desde login.html y js/login.js.


// Si el correo tiene un dominio no permitido, propone el del equipo:
// "admin@gmail.cl" -> "admin@gaselvolcan.cl"
function sugerenciaPara(correo) {
  const limpio = correo.trim().toLowerCase()
  const arroba = limpio.indexOf("@")

  if (arroba < 1 || validarCorreo(limpio) === "") {
    return ""
  }

  return limpio.slice(0, arroba) + "@gaselvolcan.cl"
}

function Login() {
  const [correo, setCorreo] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [errores, setErrores] = useState({ correo: "", contrasena: "" })
  const [mostrar, setMostrar] = useState(false)
  const [mensaje, setMensaje] = useState("")

  const { iniciarSesion } = useSesion()
  const navegar = useNavigate()

  const sugerencia = sugerenciaPara(correo)

  function cambiarCorreo(valor) {
    setCorreo(valor)
    setMensaje("")
    setErrores({ ...errores, correo: validarCorreo(valor) })
  }

  function cambiarContrasena(valor) {
    setContrasena(valor)
    setMensaje("")
    setErrores({ ...errores, contrasena: validarContrasena(valor) })
  }

  function enviar(evento) {
    evento.preventDefault()

    const nuevos = {
      correo: validarCorreo(correo),
      contrasena: validarContrasena(contrasena)
    }
    setErrores(nuevos)

    if (nuevos.correo || nuevos.contrasena) {
      evento.target.elements[nuevos.correo ? "correo" : "contrasena"].focus()
      return
    }

    const resultado = iniciarSesion(correo, contrasena)

    if (!resultado.ok) {
      setMensaje(resultado.mensaje)
      return
    }

    // Por ahora todos los roles vuelven al inicio. Cuando existan los paneles
    // de administracion, despachadora y repartidor, aqui se redirige segun el rol.
    navegar("/")
  }

  return (
    <main className="seccion-login">
      <div className="container">
        <div className="login-grid">

          <section className="login-presentacion">
            <p className="login-etiqueta">Acceso al sistema</p>
            <h1>Ingresa a tu cuenta</h1>
            <p className="login-descripcion">
              Accede a Gas El Volcán para revisar tus pedidos,
              gestionar entregas o administrar la tienda.
            </p>

            <div className="login-separador"></div>

            <ul className="login-puntos">
              <li>
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="M4 10.5 L8 14.5 L16 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>El sistema identifica automáticamente el tipo de cuenta.</span>
              </li>
              <li>
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                  <path d="M4 10.5 L8 14.5 L16 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Clientes, repartidores y administradores ingresan a vistas diferentes.</span>
              </li>
            </ul>
          </section>

          <section className="login-tarjeta">
            <div className="login-tarjeta-encabezado">
              <img className="login-icono" src="/img/logo.svg" alt="" />
              <h2>Bienvenido</h2>
              <p>Escribe tus datos para continuar</p>
            </div>

            <form id="formLogin" noValidate onSubmit={enviar}>
              <div className="login-campo">
                <label htmlFor="correo">Correo electrónico</label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  placeholder="nombre@gaselvolcan.cl"
                  autoComplete="email"
                  maxLength="100"
                  required
                  value={correo}
                  onChange={(e) => cambiarCorreo(e.target.value)}
                  className={claseCampo(correo, errores.correo)}
                />
                <small className="mensaje-error-campo" role="status">{errores.correo}</small>

                {/* Solo aparece cuando el dominio no es valido */}
                {sugerencia && (
                  <button type="button" className="sugerencia" onClick={() => cambiarCorreo(sugerencia)}>
                    ¿Quisiste decir {sugerencia}?
                  </button>
                )}
              </div>

              <div className="login-campo">
                <label htmlFor="contrasena">Contraseña</label>
                <div className="contenedor-contrasena">
                  <input
                    type={mostrar ? "text" : "password"}
                    id="contrasena"
                    name="contrasena"
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                    maxLength="10"
                    required
                    value={contrasena}
                    onChange={(e) => cambiarContrasena(e.target.value)}
                    className={claseCampo(contrasena, errores.contrasena)}
                  />
                  <button type="button" className="mostrar-contrasena" onClick={() => setMostrar(!mostrar)}>
                    {mostrar ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <small className="mensaje-ayuda">Entre 4 y 10 caracteres</small>
                <small className="mensaje-error-campo" role="status">{errores.contrasena}</small>
              </div>

              {mensaje && (
                <div className="mensaje-login" role="alert">{mensaje}</div>
              )}

              <button type="submit" className="btn btn-principal boton-login">Iniciar sesión</button>
            </form>

            <p className="login-registro">
              ¿Eres cliente y todavía no tienes una cuenta?{" "}
              <Link to="/registro">Crear cuenta</Link>
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}

export default Login
