import { startTransition, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useSesion } from '../contexto/sesionContexto'
import { buscarUsuario, actualizarCuenta, eliminarCuenta, nombreDeRol } from '../datos/usuarios'
import { leerPedidos } from '../datos/pedidos'
import { formatearPrecio } from '../datos/productos'
import { buscarZona } from '../datos/zonas'
import { claseCampo } from '../utilidades/formularios'
import { validarTexto, validarTelefono } from '../utilidades/validaciones'

// Migrado desde perfil.html y js/perfil.js.

// Sin sesion no hay perfil: se manda al login, como hacia el sitio en HTML.
// La key reinicia la ficha si cambia la cuenta.
function Perfil() {
  const { usuario } = useSesion()

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <FichaPerfil key={usuario.correo} usuario={usuario} />
}

const COMUNAS = ["Chillán", "Chillán Viejo", "El Carmen", "Pinto", "San Ignacio", "Bulnes", "Quillón"]

// Color de la etiqueta segun el estado del pedido
const CLASE_ESTADO = {
  "Pendiente": "estado-pendiente",
  "En camino": "estado-camino",
  "Entregado": "estado-entregado",
  "Cancelado": "estado-cancelado"
}

function FichaPerfil({ usuario }) {
  const { cerrarSesion, actualizarUsuario } = useSesion()
  const navegar = useNavigate()

  const esCliente = usuario.rol === "CLIENTE"
  const cuenta = buscarUsuario(usuario.correo) || usuario

  // El nombre se guarda completo; aqui se separa en nombre y apellidos
  const partes = String(cuenta.nombre).trim().split(/\s+/)

  const [datos, setDatos] = useState({
    nombre: partes[0] || "",
    apellidos: partes.slice(1).join(" "),
    telefono: cuenta.telefono || "",
    direccion: cuenta.direccion || "",
    comuna: cuenta.comuna || ""
  })
  const [errores, setErrores] = useState({})
  const [guardado, setGuardado] = useState("")
  const [confirmandoBaja, setConfirmandoBaja] = useState(false)

  // La direccion solo es obligatoria para los clientes, que reciben pedidos
  const reglas = {
    nombre: (d) => validarTexto(d.nombre, 50, "Ingresa tu nombre."),
    apellidos: (d) => validarTexto(d.apellidos, 100, "Ingresa tus apellidos."),
    telefono: (d) => validarTelefono(d.telefono),
    ...(esCliente && {
      direccion: (d) => validarTexto(d.direccion, 300, "Ingresa tu dirección de despacho.")
    })
  }

  const zona = buscarZona(datos.comuna)

  // Los pedidos de esta cuenta, del mas reciente al mas antiguo
  const pedidos = leerPedidos()
    .filter((pedido) => String(pedido.cliente?.correo).toLowerCase() === usuario.correo.toLowerCase())
    .sort((a, b) => b.numero - a.numero)

  function cambiar(evento) {
    const { name, value } = evento.target
    const nuevos = { ...datos, [name]: value }

    setDatos(nuevos)
    setGuardado("")

    if (reglas[name]) {
      setErrores({ ...errores, [name]: reglas[name](nuevos) })
    }
  }

  function guardar(evento) {
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

    const nombreCompleto = datos.nombre.trim() + " " + datos.apellidos.trim()

    actualizarCuenta(usuario.correo, {
      nombre: nombreCompleto,
      telefono: datos.telefono.trim(),
      direccion: datos.direccion.trim(),
      comuna: datos.comuna.trim()
    })

    // Asi el navbar muestra las iniciales nuevas
    actualizarUsuario({ nombre: nombreCompleto })
    setGuardado("Tus datos quedaron guardados.")
  }

  function eliminar() {
    eliminarCuenta(usuario.correo)

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
            Hola, {partes[0]}. {esCliente
              ? "Revisa tus datos y el historial de tus pedidos."
              : "Revisa y actualiza tus datos de contacto."}
          </p>
        </div>
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
                      {COMUNAS.map((comuna) => <option key={comuna} value={comuna} />)}
                    </datalist>
                    {datos.comuna.trim() !== "" && (
                      <small className={zona ? "mensaje-ayuda aviso-cobertura-ok" : "mensaje-ayuda aviso-cobertura-no"}>
                        {zona ? "Llegamos a tu comuna: " + zona.zona + "." : "Todavía no tenemos reparto en esa comuna."}
                      </small>
                    )}
                  </div>
                </>
              )}

              {guardado && <div className="mensaje-exito" role="alert">{guardado}</div>}

              <button type="submit" className="btn btn-principal">Guardar cambios</button>
            </form>

            {/* Solo los clientes pueden eliminar su cuenta. Se pide confirmar antes. */}
            {esCliente && (
              <div className="zona-baja">
                <h3>Eliminar mi cuenta</h3>
                <p>Se borran tu cuenta y tus datos de contacto. No se puede deshacer.</p>

                {confirmandoBaja ? (
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-peligro" onClick={eliminar}>
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
                <p className="panel-bajada">
                  {pedidos.length === 0
                    ? "Aquí verás el detalle de cada compra."
                    : pedidos.length === 1
                      ? "Tienes 1 pedido registrado."
                      : "Tienes " + pedidos.length + " pedidos registrados."}
                </p>

                {pedidos.length === 0 ? (
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
                            <li key={linea.codigo}>
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
              </div>
            )}
          </div>

        </div>
      </section>
    </main>
  )
}

export default Perfil
