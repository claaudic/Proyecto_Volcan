import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'
import { validarCorreo, runValido } from '../utilidades/validaciones'
import { useApi } from '../utilidades/useApi'
import { COMUNAS_COBERTURA } from '../datos/zonas'
import { nombreCompleto, nombreDeRol } from '../datos/usuarios'

// Las cuentas viven en ms-usuarios (MySQL): se listan con GET /usuarios
// y se crean, editan y eliminan con POST, PUT y DELETE /usuarios/{id}.
// El backend repite todas las reglas; las de aquí solo avisan antes de enviar.

const FORMULARIO_VACIO = {
    run: '',
    nombre: '',
    apellidos: '',
    correo: '',
    contrasena: '',
    nacimiento: '',
    region: 'Ñuble',
    comuna: '',
    direccion: '',
    rol: ''
}

// Un campo del formulario: etiqueta, la casilla (children), una ayuda opcional
// y el mensaje de error. Antes este bloque estaba copiado 10 veces.
function Campo({ id, etiqueta, error, ayuda, clase = 'mb-3', children }) {
    return (
        <div className={clase}>
            <label htmlFor={id} className="form-label">{etiqueta}</label>
            {children}
            {ayuda && <div className="form-text">{ayuda}</div>}
            {error && <div className="text-danger mt-1">{error}</div>}
        </div>
    )
}

// Ventana emergente con título y botón de cerrar.
// La usan el formulario de usuario y la confirmación para eliminar.
function Modal({ idTitulo, titulo, alCerrar, children }) {
    return (
        <>
            <div
                className="modal fade show"
                style={{ display: 'block' }}
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                aria-labelledby={idTitulo}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 id={idTitulo} className="modal-title fs-5">{titulo}</h2>
                            <button type="button" className="btn-close" aria-label="Cerrar" onClick={alCerrar}></button>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    )
}

// Hoy en formato "2026-11-07", con la fecha del computador (no la de Londres)
function hoyISO() {
    const hoy = new Date()
    const dos = (numero) => String(numero).padStart(2, '0')
    return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`
}

// Los datos que ya tiene una cuenta, en el formato que pide PUT /usuarios/{id}.
// Se reenvían todos para no borrar los que el formulario no muestra (como el teléfono).
function datosDeCuenta(cuenta) {
    return {
        run: cuenta.run || null,
        nombre: cuenta.nombre,
        apellidos: cuenta.apellidos,
        correo: cuenta.correo,
        rol: cuenta.rol,
        telefono: cuenta.telefono || null,
        comuna: cuenta.comuna || null,
        direccion: cuenta.direccion || null,
        nacimiento: cuenta.nacimiento || null,
        region: cuenta.region || null
    }
}

function AdminUsuarios() {
    const { usuario, llamarApi } = useSesion()

    const lista = useApi(usuario?.rol === 'ADMINISTRADOR' ? '/usuarios' : null)
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
    const [idEditando, setIdEditando] = useState(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [usuarioABorrar, setUsuarioABorrar] = useState(null)
    const [errores, setErrores] = useState({})
    const [mensaje, setMensaje] = useState('')
    // Mientras el backend responde, los botones quedan desactivados
    const [enviando, setEnviando] = useState(false)

    if (!usuario || usuario.rol !== 'ADMINISTRADOR') {
        return <Navigate to="/login" replace />
    }

    const usuarios = lista.datos || []
    const editando = idEditando !== null
    const cuentaEditando = editando ? usuarios.find((cuenta) => cuenta.id === idEditando) : null

    function esMiCuenta(cuenta) {
        return usuario.correo?.toLowerCase() === cuenta.correo.toLowerCase()
    }

    const editandoCuentaPropia = Boolean(cuentaEditando) && esMiCuenta(cuentaEditando)

    // Las cuentas de demostración se crearon sin RUN, comuna ni dirección
    const cuentaAntiguaSin = (campo) => editando && !cuentaEditando?.[campo]

    // Envía al backend y, si sale bien, vuelve a pedir la lista.
    // Si falla, muestra el mensaje del backend (por ejemplo, correo repetido).
    async function enviar(ruta, opciones) {
        setEnviando(true)
        setMensaje('')

        try {
            await llamarApi(ruta, opciones)
            lista.recargar()
            return true
        } catch (error) {
            setMensaje(error.message)
            return false
        } finally {
            setEnviando(false)
        }
    }

    function cambiarCampo(evento) {
        const { name, value } = evento.target
        setFormulario((anterior) => ({ ...anterior, [name]: value }))
    }

    function abrirFormulario(datos, id) {
        setFormulario(datos)
        setIdEditando(id)
        setErrores({})
        setMensaje('')
        setMostrarFormulario(true)
    }

    function abrirNuevoUsuario() {
        abrirFormulario(FORMULARIO_VACIO, null)
    }

    // El backend ya manda nombre y apellidos por separado
    function abrirEditarUsuario(cuenta) {
        abrirFormulario({
            run: cuenta.run || '',
            nombre: cuenta.nombre || '',
            apellidos: cuenta.apellidos || '',
            correo: cuenta.correo || '',
            contrasena: '',
            nacimiento: cuenta.nacimiento || '',
            region: cuenta.region || 'Ñuble',
            comuna: cuenta.comuna || '',
            direccion: cuenta.direccion || '',
            rol: cuenta.rol || ''
        }, cuenta.id)
    }

    function cerrarFormulario() {
        setFormulario(FORMULARIO_VACIO)
        setIdEditando(null)
        setErrores({})
        setMensaje('')
        setMostrarFormulario(false)
    }

    function validarFormulario() {
        const nuevosErrores = {}

        const run = formulario.run.trim().toUpperCase()
        const nombre = formulario.nombre.trim()
        const apellidos = formulario.apellidos.trim()
        const correo = formulario.correo.trim().toLowerCase()
        const contrasena = formulario.contrasena.trim()
        const direccion = formulario.direccion.trim()

        // Al crear todo es obligatorio; al editar una cuenta antigua,
        // RUN, comuna y dirección solo si ya los tenía
        const creando = !editando
        const exigirRun = creando || Boolean(cuentaEditando?.run)
        const exigirComuna = creando || Boolean(cuentaEditando?.comuna)
        const exigirDireccion = creando || Boolean(cuentaEditando?.direccion)

        if (run === '') {
            if (exigirRun) {
                nuevosErrores.run = 'Ingresa el RUN.'
            }
        } else if (run.length < 7 || run.length > 9) {
            nuevosErrores.run = 'El RUN debe tener entre 7 y 9 caracteres, sin puntos ni guion.'
        } else if (!runValido(run)) {
            nuevosErrores.run = 'Ese RUN no es válido. Revisa el dígito verificador.'
        }

        if (nombre === '') {
            nuevosErrores.nombre = 'Ingresa el nombre.'
        } else if (nombre.length > 50) {
            nuevosErrores.nombre = 'El nombre no puede superar los 50 caracteres.'
        }

        if (apellidos === '') {
            nuevosErrores.apellidos = 'Ingresa los apellidos.'
        } else if (apellidos.length > 100) {
            nuevosErrores.apellidos = 'Los apellidos no pueden superar los 100 caracteres.'
        }

        const errorCorreo = validarCorreo(correo)
        if (errorCorreo) {
            nuevosErrores.correo = errorCorreo
        }

        // Al editar, la contraseña vacía significa "mantener la anterior"
        if (creando || contrasena !== '') {
            if (contrasena.length < 4) {
                nuevosErrores.contrasena = 'La contraseña debe tener al menos 4 caracteres.'
            } else if (contrasena.length > 10) {
                nuevosErrores.contrasena = 'La contraseña no puede superar los 10 caracteres.'
            }
        }

        // Opcional, pero nunca una fecha futura (la misma regla del backend)
        if (formulario.nacimiento > hoyISO()) {
            nuevosErrores.nacimiento = 'La fecha de nacimiento no puede ser una fecha futura.'
        }

        if (formulario.comuna === '' && exigirComuna) {
            nuevosErrores.comuna = 'Selecciona una comuna.'
        }

        if (direccion === '') {
            if (exigirDireccion) {
                nuevosErrores.direccion = 'Ingresa la dirección.'
            }
        } else if (direccion.length > 300) {
            nuevosErrores.direccion = 'La dirección no puede superar los 300 caracteres.'
        }

        if (formulario.rol === '') {
            nuevosErrores.rol = 'Selecciona un rol.'
        }

        setErrores(nuevosErrores)
        return Object.keys(nuevosErrores).length === 0
    }

    async function guardarUsuario(evento) {
        evento.preventDefault()
        setMensaje('')

        if (!validarFormulario()) {
            return
        }

        // Lo que no se escribió va como null. Al editar: la contraseña vacía
        // mantiene la anterior y el teléfono se conserva (el formulario no lo muestra).
        // En la cuenta propia no se cambian ni el correo ni el rol.
        const cuerpo = {
            run: formulario.run.trim().toUpperCase() || null,
            nombre: formulario.nombre.trim(),
            apellidos: formulario.apellidos.trim(),
            correo: editandoCuentaPropia ? cuentaEditando.correo : formulario.correo.trim().toLowerCase(),
            contrasena: formulario.contrasena.trim() || null,
            rol: editandoCuentaPropia ? usuario.rol : formulario.rol,
            telefono: cuentaEditando?.telefono || null,
            comuna: formulario.comuna || null,
            direccion: formulario.direccion.trim() || null,
            nacimiento: formulario.nacimiento || null,
            region: formulario.region || 'Ñuble'
        }

        const guardado = editando
            ? await enviar(`/usuarios/${idEditando}`, { metodo: 'PUT', cuerpo })
            : await enviar('/usuarios', { metodo: 'POST', cuerpo })

        if (guardado) {
            cerrarFormulario()
        }
    }

    function alternarEstado(cuenta) {
        setMensaje('')

        if (esMiCuenta(cuenta)) {
            setMensaje('No puedes desactivar tu propia cuenta.')
            return
        }

        enviar(`/usuarios/${cuenta.id}`, {
            metodo: 'PUT',
            cuerpo: { ...datosDeCuenta(cuenta), activo: cuenta.activo === false }
        })
    }

    function abrirEliminar(cuenta) {
        setMensaje('')

        if (esMiCuenta(cuenta)) {
            setMensaje('No puedes eliminar tu propia cuenta.')
            return
        }

        setUsuarioABorrar(cuenta)
    }

    async function confirmarEliminar() {
        const cuenta = usuarioABorrar
        setUsuarioABorrar(null)
        await enviar(`/usuarios/${cuenta.id}`, { metodo: 'DELETE' })
    }

    return (
        <main id="contenidoAdmin">
            <section className="pagina-encabezado" aria-labelledby="titulo-pagina">
                <div className="encabezado-fondo" aria-hidden="true">
                    <span className="luz luz-encabezado-verde"></span>
                    <span className="luz luz-encabezado-celeste"></span>
                    <span className="encabezado-arco"></span>
                </div>

                <div className="container">
                    <p className="panel-etiqueta">Administración</p>
                    <h1 id="titulo-pagina">Gestión de usuarios</h1>
                    <p className="pagina-bajada">
                        Crea cuentas, asigna roles y administra los accesos al sistema.
                    </p>
                    <p className="encabezado-accion">
                        <button type="button" className="btn btn-principal" onClick={abrirNuevoUsuario}>
                            + Crear usuario
                        </button>
                    </p>
                </div>

                <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                    <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
                </svg>
            </section>

            <div className="panel-cuerpo">
                <div className="container">
                    <section className="panel-aviso">
                        <h2>Gestión de usuarios</h2>
                        <p>Desde aquí puedes crear, editar, desactivar usuarios y asignar roles.</p>
                    </section>

                    {mensaje && <div className="alert alert-warning mt-3" role="alert">{mensaje}</div>}
                    {lista.error && (
                        <div className="alert alert-warning mt-3" role="alert">
                            No se pudo cargar la lista de usuarios. {lista.error}
                        </div>
                    )}

                    <section className="mt-4">
                        <div className="tabla-marco table-responsive">
                            <table className="tabla-panel">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Correo</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {lista.cargando && (
                                        <tr><td colSpan="5" role="status">Cargando usuarios…</td></tr>
                                    )}
                                    {usuarios.map((cuenta) => {
                                        const inactiva = cuenta.activo === false

                                        return (
                                            <tr key={cuenta.id}>
                                                <td><strong>{nombreCompleto(cuenta)}</strong></td>
                                                <td>{cuenta.correo}</td>
                                                <td>{nombreDeRol(cuenta.rol)}</td>
                                                <td>
                                                    <span className={inactiva ? 'badge bg-secondary' : 'badge bg-success'}>
                                                        {inactiva ? 'Inactivo' : 'Activo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary me-1 mb-1"
                                                        onClick={() => abrirEditarUsuario(cuenta)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-sm ${inactiva ? 'btn-outline-success' : 'btn-outline-warning'} me-1 mb-1`}
                                                        onClick={() => alternarEstado(cuenta)}
                                                        disabled={enviando}
                                                    >
                                                        {inactiva ? 'Activar' : 'Desactivar'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger mb-1"
                                                        onClick={() => abrirEliminar(cuenta)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>

            {mostrarFormulario && (
                <Modal
                    idTitulo="tituloModalUsuario"
                    titulo={editando ? 'Editar usuario' : 'Crear usuario'}
                    alCerrar={cerrarFormulario}
                >
                    <form noValidate onSubmit={guardarUsuario}>
                        <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
                            <Campo id="runUsuario" etiqueta="RUN" error={errores.run}>
                                <input
                                    id="runUsuario" name="run" type="text" className="form-control" maxLength="9"
                                    placeholder={cuentaAntiguaSin('run') ? 'Opcional para esta cuenta antigua' : 'Sin puntos ni guion'}
                                    value={formulario.run} onChange={cambiarCampo}
                                />
                            </Campo>

                            <Campo id="nombreUsuario" etiqueta="Nombre" error={errores.nombre}>
                                <input
                                    id="nombreUsuario" name="nombre" type="text" className="form-control" maxLength="50"
                                    value={formulario.nombre} onChange={cambiarCampo}
                                />
                            </Campo>

                            <Campo id="apellidosUsuario" etiqueta="Apellidos" error={errores.apellidos}>
                                <input
                                    id="apellidosUsuario" name="apellidos" type="text" className="form-control" maxLength="100"
                                    value={formulario.apellidos} onChange={cambiarCampo}
                                />
                            </Campo>

                            <Campo
                                id="correoUsuario" etiqueta="Correo" error={errores.correo}
                                ayuda={editandoCuentaPropia && 'No puedes cambiar el correo de tu propia cuenta.'}
                            >
                                <input
                                    id="correoUsuario" name="correo" type="email" className="form-control" maxLength="100"
                                    value={formulario.correo} onChange={cambiarCampo} disabled={editandoCuentaPropia}
                                />
                            </Campo>

                            <Campo id="contrasenaUsuario" etiqueta="Contraseña" error={errores.contrasena}>
                                <input
                                    id="contrasenaUsuario" name="contrasena" type="password" className="form-control"
                                    minLength="4" maxLength="10"
                                    placeholder={editando ? 'Déjala vacía para mantenerla' : ''}
                                    value={formulario.contrasena} onChange={cambiarCampo}
                                />
                            </Campo>

                            <Campo
                                id="nacimientoUsuario" error={errores.nacimiento}
                                etiqueta={<>Fecha de nacimiento{' '}<span className="text-muted">(opcional)</span></>}
                            >
                                {/* max: el calendario no deja elegir días futuros */}
                                <input
                                    id="nacimientoUsuario" name="nacimiento" type="date" className="form-control"
                                    max={hoyISO()} value={formulario.nacimiento} onChange={cambiarCampo}
                                />
                            </Campo>

                            <div className="row">
                                {/* En la EP2 todas las comunas con reparto son de Ñuble */}
                                <Campo id="regionUsuario" etiqueta="Región" clase="col-md-6 mb-3">
                                    <input
                                        id="regionUsuario" type="text" className="form-control"
                                        value={formulario.region || 'Ñuble'} readOnly
                                    />
                                </Campo>

                                <Campo id="comunaUsuario" etiqueta="Comuna" error={errores.comuna} clase="col-md-6 mb-3">
                                    <select
                                        id="comunaUsuario" name="comuna" className="form-select"
                                        value={formulario.comuna} onChange={cambiarCampo}
                                    >
                                        <option value="">
                                            {cuentaAntiguaSin('comuna') ? 'Sin comuna registrada' : 'Selecciona una comuna'}
                                        </option>
                                        {COMUNAS_COBERTURA.map((comuna) => (
                                            <option key={comuna} value={comuna}>{comuna}</option>
                                        ))}
                                    </select>
                                </Campo>
                            </div>

                            <Campo id="direccionUsuario" etiqueta="Dirección" error={errores.direccion}>
                                <input
                                    id="direccionUsuario" name="direccion" type="text" className="form-control" maxLength="300"
                                    placeholder={cuentaAntiguaSin('direccion') ? 'Opcional para esta cuenta antigua' : ''}
                                    value={formulario.direccion} onChange={cambiarCampo}
                                />
                            </Campo>

                            <Campo
                                id="rolUsuarioForm" etiqueta="Rol" error={errores.rol}
                                ayuda={editandoCuentaPropia && 'No puedes cambiar tu propio rol.'}
                            >
                                <select
                                    id="rolUsuarioForm" name="rol" className="form-select"
                                    value={formulario.rol} onChange={cambiarCampo} disabled={editandoCuentaPropia}
                                >
                                    <option value="">Selecciona un rol</option>
                                    {/* Administrador solo aparece si la cuenta ya lo es: no se crean nuevos */}
                                    {formulario.rol === 'ADMINISTRADOR' && (
                                        <option value="ADMINISTRADOR">Administrador</option>
                                    )}
                                    <option value="REPARTIDOR">Repartidor</option>
                                    <option value="DESPACHADORA">Operadora / Despachadora</option>
                                    <option value="CLIENTE">Cliente</option>
                                </select>
                            </Campo>

                            {mensaje && <div className="alert alert-warning mb-0" role="alert">{mensaje}</div>}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={cerrarFormulario}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-principal" disabled={enviando}>
                                {editando ? 'Guardar cambios' : 'Guardar usuario'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {usuarioABorrar && (
                <Modal
                    idTitulo="tituloEliminarUsuario"
                    titulo="¿Eliminar usuario?"
                    alCerrar={() => setUsuarioABorrar(null)}
                >
                    <div className="modal-body">
                        <p>Vas a eliminar la cuenta de:</p>
                        <p className="mb-1"><strong>{nombreCompleto(usuarioABorrar)}</strong></p>
                        <p className="text-muted">{usuarioABorrar.correo}</p>
                        <p className="mb-0">
                            Si solo quieres impedir su acceso temporalmente, puedes usar Desactivar.
                        </p>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={() => setUsuarioABorrar(null)}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-peligro" onClick={confirmarEliminar}>
                            Sí, eliminar
                        </button>
                    </div>
                </Modal>
            )}
        </main>
    )
}

export default AdminUsuarios
