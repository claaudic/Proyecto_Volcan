import { startTransition, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../contexto/sesionContexto'
import { nombreCompleto, nombreDeRol, panelDeRol } from '../datos/usuarios'
import { formatearPrecio } from '../datos/productos'
import { COMUNAS_COBERTURA } from '../datos/zonas'
import AvisoCobertura from '../components/AvisoCobertura'
import { claseCampo } from '../utilidades/formularios'
import { validarTexto, validarTelefono, validarDireccion } from '../utilidades/validaciones'
import { useApi } from '../utilidades/useApi'

// Migrado desde perfil.html y js/perfil.js.

// Solo con sesion: RutaProtegida (App.jsx) manda al login a quien no la tiene.
// La key reinicia la ficha si cambia la cuenta.
function Perfil() {
  const { usuario } = useSesion()

  return <CargaPerfil key={usuario.correo} usuario={usuario} />
}

// Pide los datos de la cuenta a ms-usuarios (GET /usuarios/yo) y,
// cuando llegan, muestra la ficha. El backend sabe quien es por el token.
function CargaPerfil({ usuario }) {
  const { datos: cuenta, error } = useApi("/usuarios/yo")

  if (!cuenta) {
    return (
      <main>
        <section className="perfil">
          <div className="container">
            {error
              ? <div className="mensaje-login" role="alert">{error}</div>
              : <p role="status">Cargando tus datos…</p>}
          </div>
        </section>
      </main>
    )
  }

  return <FichaPerfil usuario={usuario} cuenta={cuenta} />
}

// El backend manda el estado en mayúsculas; aquí se muestra con su nombre
const NOMBRE_ESTADO = {
  PENDIENTE: "Pendiente",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado"
}

// Color de la etiqueta segun el estado del pedido
const CLASE_ESTADO = {
  "Pendiente": "estado-pendiente",
  "En camino": "estado-camino",
  "Entregado": "estado-entregado",
  "Cancelado": "estado-cancelado"
}

function FichaPerfil({ usuario, cuenta }) {
  const { cerrarSesion, actualizarUsuario, llamarApi } = useSesion()
  const navegar = useNavigate()

  const esCliente = usuario.rol === "CLIENTE"

  // El nombre para el saludo (el navbar guarda el nombre completo)
  const primerNombre = String(usuario.nombre).trim().split(/\s+/)[0]

  // El backend ya manda nombre y apellidos por separado
  const [datos, setDatos] = useState({
    nombre: cuenta.nombre || "",
    apellidos: cuenta.apellidos || "",
    telefono: cuenta.telefono || "",
    direccion: cuenta.direccion || "",
    comuna: cuenta.comuna || ""
  })
  const [errores, setErrores] = useState({})
  const [guardado, setGuardado] = useState("")
  // Error que manda el backend (por ejemplo, sin conexion)
  const [mensaje, setMensaje] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [confirmandoBaja, setConfirmandoBaja] = useState(false)

  // La direccion solo es obligatoria para los clientes, que reciben pedidos
  const reglas = {
    nombre: (d) => validarTexto(d.nombre, 50, "Ingresa tu nombre."),
    apellidos: (d) => validarTexto(d.apellidos, 100, "Ingresa tus apellidos."),
    telefono: (d) => validarTelefono(d.telefono),
    ...(esCliente && {
      direccion: (d) => validarDireccion(d.direccion)
    })
  }

  // Pedidos reales del cliente: GET /boletas devuelve solo los suyos (lo filtra ms-pedidos
  // con el id del token). Los nombres de los productos salen del catálogo.
  const boletas = useApi(esCliente ? "/boletas" : null)
  const catalogo = useApi(esCliente ? "/productos" : null)

  // Del más reciente al más antiguo
  const pedidos = (boletas.datos || [])
    .map((boleta) => ({
      numero: boleta.id,
      fecha: boleta.fecha,
      estado: NOMBRE_ESTADO[boleta.estado] || boleta.estado,
      total: boleta.total,
      productos: boleta.detalles.map((detalle) => ({
        id: detalle.id,
        nombre: (catalogo.datos || []).find((p) => p.id === detalle.productoId)?.nombre || "Producto",
        cantidad: detalle.cantidad,
        subtotal: detalle.precio * detalle.cantidad
      }))
    }))
    .sort((a, b) => b.numero - a.numero)

  function cambiar(evento) {
    const { name, value } = evento.target
    const nuevos = { ...datos, [name]: value }

    setDatos(nuevos)
    setGuardado("")
    setMensaje("")

    if (reglas[name]) {
      setErrores({ ...errores, [name]: reglas[name](nuevos) })
    }
  }

  async function guardar(evento) {
    evento.preventDefault()

    const nuevos = {}
    Object.keys(reglas).forEach((campo) => {
      nuevos[campo] = reglas[campo](datos)
    })
    setErrores(nuevos)

    const primerError = Object.keys(nuevos).find((campo) => nuevos[campo] !== "")

    if (primerError) {
      evento.target.elements[primerError].focus()
      return
    }

    setEnviando(true)
    setMensaje("")

    try {
      // PUT /usuarios/yo: el correo y el rol no se envian, no se cambian aqui
      const editada = await llamarApi("/usuarios/yo", {
        metodo: "PUT",
        cuerpo: {
          nombre: datos.nombre.trim(),
          apellidos: datos.apellidos.trim(),
          telefono: datos.telefono.trim(),
          comuna: datos.comuna.trim(),
          direccion: datos.direccion.trim()
        }
      })

      // Asi el navbar muestra las iniciales nuevas
      actualizarUsuario({ nombre: nombreCompleto(editada) })
      setGuardado("Tus datos quedaron guardados.")
    } catch (error) {
      // El mensaje viene del backend, por ejemplo una validacion
      setMensaje(error.message)
    } finally {
      setEnviando(false)
    }
  }

  async function eliminar() {
    setEnviando(true)

    try {
      await llamarApi("/usuarios/yo", { metodo: "DELETE" })
    } catch (error) {
      setMensaje(error.message)
      setEnviando(false)
      return
    }

    // Cerrar la sesion y navegar van juntos en una transicion (React Router
    // navega asi). Si no, el perfil se dibuja sin usuario y manda al login.
    startTransition(() => {
      cerrarSesion()
      navegar("/")
    })
  }

  return (
    <main>
      <section className="pagina-encabezado" aria-labelledby="titulo-perfil">
        <div className="encabezado-fondo" aria-hidden="true">
          <span className="luz luz-encabezado-verde"></span>
          <span className="luz luz-encabezado-celeste"></span>
          <span className="encabezado-arco"></span>
        </div>

        <div className="container">
          <h1 id="titulo-perfil">Mi perfil</h1>
          <p className="pagina-bajada">
            Hola, {primerNombre}. {esCliente
              ? "Revisa tus datos y el historial de tus pedidos."
              : "Revisa y actualiza tus datos de contacto."}
          </p>
        </div>

        <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
        </svg>
      </section>

      <section className="perfil" aria-labelledby="titulo-datos">
        <div className="container perfil-grid">

          <div className="tarjeta-panel">
            <h2 id="titulo-datos">Mis datos</h2>
            <p className="panel-bajada">Los campos marcados con asterisco son obligatorios.</p>

            <form id="formPerfil" noValidate onSubmit={guardar}>
              <div className="campo">
                <label htmlFor="nombre">Nombre <abbr title="obligatorio">*</abbr></label>
                <input
                  type="text" id="nombre" name="nombre" autoComplete="given-name" maxLength="50" required
                  value={datos.nombre} onChange={cambiar}
                  className={claseCampo(datos.nombre, errores.nombre)}
                />
                <small className="mensaje-error-campo" role="status">{errores.nombre}</small>
              </div>

              <div className="campo">
                <label htmlFor="apellidos">Apellidos <abbr title="obligatorio">*</abbr></label>
                <input
                  type="text" id="apellidos" name="apellidos" autoComplete="family-name" maxLength="100" required
                  value={datos.apellidos} onChange={cambiar}
                  className={claseCampo(datos.apellidos, errores.apellidos)}
                />
                <small className="mensaje-error-campo" role="status">{errores.apellidos}</small>
              </div>

              <div className="campo">
                <label htmlFor="correo">Correo electrónico</label>
                <input type="email" id="correo" value={usuario.correo} readOnly />
                <small className="mensaje-ayuda">El correo es tu identificador de acceso y no se puede cambiar.</small>
              </div>

              <div className="campo">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel" id="telefono" name="telefono" autoComplete="tel" maxLength="15"
                  placeholder="+56 9 1234 5678"
                  value={datos.telefono} onChange={cambiar}
                  className={claseCampo(datos.telefono, errores.telefono)}
                />
                <small className="mensaje-error-campo" role="status">{errores.telefono}</small>
              </div>

              {/* Direccion y comuna solo para clientes: son para el despacho */}
              {esCliente && (
                <>
                  <div className="campo">
                    <label htmlFor="direccion">Dirección de despacho <abbr title="obligatorio">*</abbr></label>
                    <input
                      type="text" id="direccion" name="direccion" autoComplete="street-address" maxLength="300" required
                      value={datos.direccion} onChange={cambiar}
                      className={claseCampo(datos.direccion, errores.direccion)}
                    />
                    <small className="mensaje-error-campo" role="status">{errores.direccion}</small>
                  </div>

                  <div className="campo">
                    <label htmlFor="comuna">Comuna</label>
                    <input
                      type="text" id="comuna" name="comuna" list="comunasPerfil" maxLength="60"
                      placeholder="Escribe tu comuna"
                      value={datos.comuna} onChange={cambiar}
                    />
                    <datalist id="comunasPerfil">
                      {COMUNAS_COBERTURA.map((comuna) => <option key={comuna} value={comuna} />)}
                    </datalist>
                    <AvisoCobertura comuna={datos.comuna} />
                  </div>
                </>
              )}

              {guardado && <div className="mensaje-exito" role="alert">{guardado}</div>}
              {mensaje && <div className="mensaje-login" role="alert">{mensaje}</div>}

              <button type="submit" className="btn btn-principal" disabled={enviando}>
                {enviando ? "Guardando…" : "Guardar cambios"}
              </button>
            </form>

            {/* Solo los clientes pueden eliminar su cuenta. Se pide confirmar antes. */}
            {esCliente && (
              <div className="zona-baja">
                <h3>Eliminar mi cuenta</h3>
                <p>Se borran tu cuenta y tus datos de contacto. No se puede deshacer.</p>

                {confirmandoBaja ? (
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-peligro" onClick={eliminar} disabled={enviando}>
                      Sí, eliminar mi cuenta
                    </button>
                    <button type="button" className="btn btn-secundario" onClick={() => setConfirmandoBaja(false)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn btn-peligro" onClick={() => setConfirmandoBaja(true)}>
                    Eliminar mi cuenta
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            {esCliente ? (
              <div className="tarjeta-panel">
                <h2>Mis pedidos</h2>
                {boletas.cargando && <p role="status">Cargando tus pedidos…</p>}
                {boletas.error && <p className="mensaje-error-campo" role="alert">{boletas.error}</p>}
                <p className="panel-bajada">
                  {pedidos.length === 0
                    ? "Aquí verás el detalle de cada compra."
                    : pedidos.length === 1
                      ? "Tienes 1 pedido registrado."
                      : "Tienes " + pedidos.length + " pedidos registrados."}
                </p>

                {boletas.cargando || boletas.error ? null : pedidos.length === 0 ? (
                  <div className="perfil-sin-pedidos">
                    <p>Todavía no has hecho ningún pedido.</p>
                    <Link className="btn btn-secundario" to="/productos">Ver el catálogo</Link>
                  </div>
                ) : (
                  <ul className="lista-pedidos list-unstyled">
                    {pedidos.map((pedido) => (
                      <li key={pedido.numero} className="pedido">
                        <div className="pedido-cabecera">
                          <div>
                            <p className="pedido-numero">Pedido N° {pedido.numero}</p>
                            <p className="pedido-fecha">
                              {new Date(pedido.fecha).toLocaleDateString("es-CL", {
                                day: "2-digit", month: "long", year: "numeric"
                              })}
                            </p>
                          </div>
                          <div className="pedido-cierre">
                            <span className={"estado-pedido " + (CLASE_ESTADO[pedido.estado] || "estado-pendiente")}>
                              {pedido.estado}
                            </span>
                            <strong className="pedido-total">{formatearPrecio(pedido.total)}</strong>
                          </div>
                        </div>

                        <ul className="pedido-lineas list-unstyled">
                          {pedido.productos.map((linea) => (
                            <li key={linea.id}>
                              {linea.cantidad} × {linea.nombre}
                              <span>{formatearPrecio(linea.subtotal)}</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="tarjeta-panel">
                <h2>Mi cuenta en el sistema</h2>
                <p className="panel-bajada">Este es el acceso que tienes asignado.</p>
                <p className="perfil-rol">{nombreDeRol(usuario.rol)}</p>
                <p className="perfil-rol-nota">
                  Tu correo {usuario.correo} tiene acceso al panel de trabajo.
                </p>
                {panelDeRol(usuario.rol) && (
                  <Link className="btn btn-principal" to={panelDeRol(usuario.rol)}>Ir a mi panel</Link>
                )}
              </div>
            )}
          </div>

        </div>
      </section>
    </main>
  )
}

export default Perfil
