import { useState } from 'react'
import { Navigate } from 'react-router-dom'

import { useSesion } from '../contexto/sesionContexto'

import {
    leerUsuarios,
    crearUsuario,
    actualizarUsuarioAdmin,
    cambiarEstadoUsuario,
    eliminarCuenta,
    nombreDeRol
} from '../datos/usuarios'

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

const DOMINIOS_PERMITIDOS = [
    '@gaselvolcan.cl',
    '@duoc.cl',
    '@profesor.duoc.cl',
    '@gmail.com'
]

const COMUNAS_COBERTURA = [
    'Chillán',
    'Chillán Viejo',
    'El Carmen',
    'Pinto',
    'San Ignacio',
    'Bulnes',
    'Quillón'
]

function AdminUsuarios() {
    const { usuario } = useSesion()

    const [usuarios, setUsuarios] = useState(leerUsuarios)
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
    const [correoEditando, setCorreoEditando] = useState(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [usuarioABorrar, setUsuarioABorrar] = useState(null)
    const [errores, setErrores] = useState({})
    const [mensaje, setMensaje] = useState('')

    // Solo puede entrar el administrador
    if (!usuario || usuario.rol !== 'ADMINISTRADOR') {
        return <Navigate to="/login" replace />
    }

    function refrescarUsuarios() {
        setUsuarios(leerUsuarios())
    }

    // =========================
    // VALIDAR RUN
    // =========================

    function runValido(valor) {
        const run = String(valor)
            .trim()
            .toUpperCase()

        if (!/^[0-9]{6,8}[0-9K]$/.test(run)) {
            return false
        }

        const cuerpo = run.slice(0, -1)
        const verificador = run.slice(-1)

        let suma = 0
        let factor = 2

        for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
            suma += Number(cuerpo[i]) * factor

            factor =
                factor === 7
                    ? 2
                    : factor + 1
        }

        const resto = 11 - (suma % 11)

        const esperado =
            resto === 11
                ? '0'
                : resto === 10
                    ? 'K'
                    : String(resto)

        return verificador === esperado
    }

    // =========================
    // FORMULARIO
    // =========================

    function cambiarCampo(evento) {
        const { name, value } = evento.target

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }))
    }

    function abrirNuevoUsuario() {
        setFormulario(FORMULARIO_VACIO)
        setCorreoEditando(null)
        setErrores({})
        setMensaje('')
        setMostrarFormulario(true)
    }

    function cerrarFormulario() {
        setFormulario(FORMULARIO_VACIO)
        setCorreoEditando(null)
        setErrores({})
        setMensaje('')
        setMostrarFormulario(false)
    }

    function abrirEditarUsuario(cuenta) {
        let nombre = cuenta.nombre || ''
        let apellidos = cuenta.apellidos || ''

        // Las cuentas base guardan nombre y apellido juntos
        if (!apellidos && nombre.includes(' ')) {
            const partes = nombre.split(' ')

            nombre = partes.shift()
            apellidos = partes.join(' ')
        }

        setFormulario({
            run: cuenta.run || '',
            nombre,
            apellidos,
            correo: cuenta.correo || '',
            contrasena: '',
            nacimiento: cuenta.nacimiento || '',
            region: 'Ñuble',
            comuna: COMUNAS_COBERTURA.includes(cuenta.comuna)
                ? cuenta.comuna
                : '',
            direccion: cuenta.direccion || '',
            rol: cuenta.rol || ''
        })

        setCorreoEditando(cuenta.correo)
        setErrores({})
        setMensaje('')
        setMostrarFormulario(true)
    }

    // =========================
    // VALIDACIONES
    // =========================

    function validarFormulario() {
        const nuevosErrores = {}

        const run = formulario.run
            .trim()
            .toUpperCase()

        const nombre = formulario.nombre.trim()
        const apellidos = formulario.apellidos.trim()

        const correo = formulario.correo
            .trim()
            .toLowerCase()

        const contrasena = formulario.contrasena.trim()
        const direccion = formulario.direccion.trim()

        if (run === '') {
            nuevosErrores.run =
                'Ingresa el RUN.'
        } else if (
            run.length < 7 ||
            run.length > 9
        ) {
            nuevosErrores.run =
                'El RUN debe tener entre 7 y 9 caracteres, sin puntos ni guion.'
        } else if (!runValido(run)) {
            nuevosErrores.run =
                'Ese RUN no es válido. Revisa el dígito verificador.'
        }

        if (nombre === '') {
            nuevosErrores.nombre =
                'Ingresa el nombre.'
        } else if (nombre.length > 50) {
            nuevosErrores.nombre =
                'El nombre no puede superar los 50 caracteres.'
        }

        if (apellidos === '') {
            nuevosErrores.apellidos =
                'Ingresa los apellidos.'
        } else if (apellidos.length > 100) {
            nuevosErrores.apellidos =
                'Los apellidos no pueden superar los 100 caracteres.'
        }

        if (correo === '') {
            nuevosErrores.correo =
                'Ingresa un correo.'
        } else if (correo.length > 100) {
            nuevosErrores.correo =
                'El correo no puede superar los 100 caracteres.'
        } else {
            const dominioValido =
                DOMINIOS_PERMITIDOS.some(
                    (dominio) =>
                        correo.endsWith(dominio)
                )

            if (!dominioValido) {
                nuevosErrores.correo =
                    'El dominio del correo no está permitido.'
            }
        }

        // Al editar puede dejar la contraseña vacía
        if (!correoEditando || contrasena !== '') {
            if (contrasena.length < 4) {
                nuevosErrores.contrasena =
                    'La contraseña debe tener al menos 4 caracteres.'
            } else if (contrasena.length > 10) {
                nuevosErrores.contrasena =
                    'La contraseña no puede superar los 10 caracteres.'
            }
        }

        if (formulario.comuna === '') {
            nuevosErrores.comuna =
                'Selecciona una comuna.'
        }

        if (direccion === '') {
            nuevosErrores.direccion =
                'Ingresa la dirección.'
        } else if (direccion.length > 300) {
            nuevosErrores.direccion =
                'La dirección no puede superar los 300 caracteres.'
        }

        if (formulario.rol === '') {
            nuevosErrores.rol =
                'Selecciona un rol.'
        }

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }

    // =========================
    // GUARDAR
    // =========================

    function guardarUsuario(evento) {
        evento.preventDefault()
        setMensaje('')

        if (!validarFormulario()) {
            return
        }

        const datos = {
            run: formulario.run
                .trim()
                .toUpperCase(),

            nombre: formulario.nombre.trim(),

            apellidos:
                formulario.apellidos.trim(),

            correo:
                formulario.correo
                    .trim()
                    .toLowerCase(),

            contrasena:
                formulario.contrasena.trim(),

            nacimiento:
            formulario.nacimiento,

            region: 'Ñuble',

            comuna:
            formulario.comuna,

            direccion:
                formulario.direccion.trim(),

            rol:
            formulario.rol
        }

        let resultado

        if (correoEditando) {
            resultado =
                actualizarUsuarioAdmin(
                    correoEditando,
                    datos
                )
        } else {
            resultado =
                crearUsuario(datos)
        }

        if (resultado?.ok === false) {
            setMensaje(resultado.mensaje)
            return
        }

        refrescarUsuarios()
        cerrarFormulario()
    }

    // =========================
    // ACTIVAR / DESACTIVAR
    // =========================

    function alternarEstado(cuenta) {
        setMensaje('')

        if (
            usuario.correo?.toLowerCase() ===
            cuenta.correo.toLowerCase()
        ) {
            setMensaje(
                'No puedes desactivar tu propia cuenta.'
            )

            return
        }

        cambiarEstadoUsuario(cuenta.correo)

        refrescarUsuarios()
    }

    // =========================
    // ELIMINAR
    // =========================

    function abrirEliminar(cuenta) {
        setMensaje('')

        if (
            usuario.correo?.toLowerCase() ===
            cuenta.correo.toLowerCase()
        ) {
            setMensaje(
                'No puedes eliminar tu propia cuenta.'
            )

            return
        }

        setUsuarioABorrar(cuenta)
    }

    function confirmarEliminar() {
        if (!usuarioABorrar) {
            return
        }

        eliminarCuenta(
            usuarioABorrar.correo
        )

        setUsuarioABorrar(null)
        refrescarUsuarios()
    }

    function nombreCompleto(cuenta) {
        if (cuenta.apellidos) {
            return `${cuenta.nombre} ${cuenta.apellidos}`
        }

        return cuenta.nombre
    }

    return (
        <main id="contenidoAdmin">

            {/* =========================
                ENCABEZADO
            ========================== */}

            <section
                className="pagina-encabezado"
                aria-labelledby="titulo-pagina"
            >
                <div
                    className="encabezado-fondo"
                    aria-hidden="true"
                >
                    <span className="luz luz-encabezado-verde"></span>
                    <span className="luz luz-encabezado-celeste"></span>
                    <span className="encabezado-arco"></span>
                </div>

                <div className="container">

                    <p className="panel-etiqueta">
                        Administración
                    </p>

                    <h1 id="titulo-pagina">
                        Gestión de usuarios
                    </h1>

                    <p className="pagina-bajada">
                        Crea cuentas, asigna roles y administra
                        los accesos al sistema.
                    </p>

                    <p className="encabezado-accion">

                        <button
                            type="button"
                            className="btn btn-principal"
                            onClick={abrirNuevoUsuario}
                        >
                            + Crear usuario
                        </button>

                    </p>

                </div>

                <svg
                    className="encabezado-monte"
                    viewBox="0 0 1440 60"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
                </svg>

            </section>

            {/* =========================
                CONTENIDO
            ========================== */}

            <div className="panel-cuerpo">

                <div className="container">

                    <section className="panel-aviso">

                        <h2>
                            Gestión de usuarios
                        </h2>

                        <p>
                            Desde aquí puedes crear, editar,
                            desactivar usuarios y asignar roles.
                        </p>

                    </section>

                    {mensaje && (
                        <div
                            className="alert alert-warning mt-3"
                            role="alert"
                        >
                            {mensaje}
                        </div>
                    )}

                    {/* =========================
                        TABLA
                    ========================== */}

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

                                {usuarios.map((cuenta) => (

                                    <tr key={cuenta.correo}>

                                        <td>
                                            <strong>
                                                {
                                                    nombreCompleto(
                                                        cuenta
                                                    )
                                                }
                                            </strong>
                                        </td>

                                        <td>
                                            {cuenta.correo}
                                        </td>

                                        <td>
                                            {
                                                nombreDeRol(
                                                    cuenta.rol
                                                )
                                            }
                                        </td>

                                        <td>

                                                <span
                                                    className={
                                                        cuenta.activo === false
                                                            ? 'badge bg-secondary'
                                                            : 'badge bg-success'
                                                    }
                                                >
                                                    {
                                                        cuenta.activo === false
                                                            ? 'Inactivo'
                                                            : 'Activo'
                                                    }
                                                </span>

                                        </td>

                                        <td>

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary me-1 mb-1"
                                                onClick={() =>
                                                    abrirEditarUsuario(
                                                        cuenta
                                                    )
                                                }
                                            >
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                className={
                                                    `btn btn-sm ${
                                                        cuenta.activo === false
                                                            ? 'btn-outline-success'
                                                            : 'btn-outline-warning'
                                                    } me-1 mb-1`
                                                }
                                                onClick={() =>
                                                    alternarEstado(
                                                        cuenta
                                                    )
                                                }
                                            >
                                                {
                                                    cuenta.activo === false
                                                        ? 'Activar'
                                                        : 'Desactivar'
                                                }
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger mb-1"
                                                onClick={() =>
                                                    abrirEliminar(
                                                        cuenta
                                                    )
                                                }
                                            >
                                                Eliminar
                                            </button>

                                        </td>

                                    </tr>

                                ))}

                                </tbody>

                            </table>

                        </div>

                    </section>

                </div>

            </div>

            {/* =========================
                MODAL CREAR / EDITAR
            ========================== */}

            {mostrarFormulario && (
                <>

                    <div
                        className="modal fade show"
                        style={{ display: 'block' }}
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tituloModalUsuario"
                    >

                        <div className="modal-dialog modal-dialog-centered">

                            <div className="modal-content">

                                <div className="modal-header">

                                    <h2
                                        id="tituloModalUsuario"
                                        className="modal-title fs-5"
                                    >
                                        {
                                            correoEditando
                                                ? 'Editar usuario'
                                                : 'Crear usuario'
                                        }
                                    </h2>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Cerrar"
                                        onClick={cerrarFormulario}
                                    ></button>

                                </div>

                                <form
                                    noValidate
                                    onSubmit={guardarUsuario}
                                >

                                    <div
                                        className="modal-body"
                                        style={{
                                            maxHeight: '68vh',
                                            overflowY: 'auto'
                                        }}
                                    >

                                        {/* RUN */}

                                        <div className="mb-3">

                                            <label
                                                htmlFor="runUsuario"
                                                className="form-label"
                                            >
                                                RUN
                                            </label>

                                            <input
                                                id="runUsuario"
                                                name="run"
                                                type="text"
                                                className="form-control"
                                                maxLength="9"
                                                placeholder="Sin puntos ni guion. Ej: 190110222"
                                                value={formulario.run}
                                                onChange={cambiarCampo}
                                            />

                                            {errores.run && (
                                                <div className="text-danger mt-1">
                                                    {errores.run}
                                                </div>
                                            )}

                                        </div>

                                        {/* NOMBRE */}

                                        <div className="mb-3">

                                            <label
                                                htmlFor="nombreUsuario"
                                                className="form-label"
                                            >
                                                Nombre
                                            </label>

                                            <input
                                                id="nombreUsuario"
                                                name="nombre"
                                                type="text"
                                                className="form-control"
                                                maxLength="50"
                                                value={formulario.nombre}
                                                onChange={cambiarCampo}
                                            />

                                            {errores.nombre && (
                                                <div className="text-danger mt-1">
                                                    {errores.nombre}
                                                </div>
                                            )}

                                        </div>

                                        {/* APELLIDOS */}

                                        <div className="mb-3">

                                            <label
                                                htmlFor="apellidosUsuario"
                                                className="form-label"
                                            >
                                                Apellidos
                                            </label>

                                            <input
                                                id="apellidosUsuario"
                                                name="apellidos"
                                                type="text"
                                                className="form-control"
                                                maxLength="100"
                                                value={formulario.apellidos}
                                                onChange={cambiarCampo}
                                            />

                                            {errores.apellidos && (
                                                <div className="text-danger mt-1">
                                                    {errores.apellidos}
                                                </div>
                                            )}

                                        </div>

                                        {/* CORREO */}

                                        <div className="mb-3">

                                            <label
                                                htmlFor="correoUsuario"
                                                className="form-label"
                                            >
                                                Correo
                                            </label>

                                            <input
                                                id="correoUsuario"
                                                name="correo"
                                                type="email"
                                                className="form-control"
                                                maxLength="100"
                                                value={formulario.correo}
                                                onChange={cambiarCampo}
                                            />

                                            {errores.correo && (
                                                <div className="text-danger mt-1">
                                                    {errores.correo}
                                                </div>
                                            )}

                                        </div>

                                        {/* CONTRASEÑA */}

                                        <div className="mb-3">

                                            <label
                                                htmlFor="contrasenaUsuario"
                                                className="form-label"
                                            >
                                                Contraseña
                                            </label>

                                            <input
                                                id="contrasenaUsuario"
                                                name="contrasena"
                                                type="password"
                                                className="form-control"
                                                minLength="4"
                                                maxLength="10"
                                                placeholder={
                                                    correoEditando
                                                        ? 'Déjala vacía para mantenerla'
                                                        : ''
                                                }
                                                value={formulario.contrasena}
                                                onChange={cambiarCampo}
                                            />

                                            {errores.contrasena && (
                                                <div className="text-danger mt-1">
                                                    {errores.contrasena}
                                                </div>
                                            )}

                                        </div>

                                        {/* FECHA */}

                                        <div className="mb-3">

                                            <label
                                                htmlFor="nacimientoUsuario"
                                                className="form-label"
                                            >
                                                Fecha de nacimiento{' '}
                                                <span className="text-muted">
                                                    (opcional)
                                                </span>
                                            </label>

                                            <input
                                                id="nacimientoUsuario"
                                                name="nacimiento"
                                                type="date"
                                                className="form-control"
                                                value={formulario.nacimiento}
                                                onChange={cambiarCampo}
                                            />

                                        </div>

                                        {/* REGIÓN / COMUNA */}

                                        <div className="row">

                                            <div className="col-md-6 mb-3">

                                                <label
                                                    htmlFor="regionUsuario"
                                                    className="form-label"
                                                >
                                                    Región
                                                </label>

                                                <input
                                                    id="regionUsuario"
                                                    type="text"
                                                    className="form-control"
                                                    value="Ñuble"
                                                    readOnly
                                                />

                                            </div>

                                            <div className="col-md-6 mb-3">

                                                <label
                                                    htmlFor="comunaUsuario"
                                                    className="form-label"
                                                >
                                                    Comuna
                                                </label>

                                                <select
                                                    id="comunaUsuario"
                                                    name="comuna"
                                                    className="form-select"
                                                    value={formulario.comuna}
                                                    onChange={cambiarCampo}
                                                >
                                                    <option value="">
                                                        Selecciona una comuna
                                                    </option>

                                                    {COMUNAS_COBERTURA.map(
                                                        (comuna) => (
                                                            <option
                                                                key={comuna}
                                                                value={comuna}
                                                            >
                                                                {comuna}
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                {errores.comuna && (
                                                    <div className="text-danger mt-1">
                                                        {errores.comuna}
                                                    </div>
                                                )}

                                            </div>

                                        </div>

                                        {/* DIRECCIÓN */}

                                        <div className="mb-3">

                                            <label
                                                htmlFor="direccionUsuario"
                                                className="form-label"
                                            >
                                                Dirección
                                            </label>

                                            <input
                                                id="direccionUsuario"
                                                name="direccion"
                                                type="text"
                                                className="form-control"
                                                maxLength="300"
                                                value={formulario.direccion}
                                                onChange={cambiarCampo}
                                            />

                                            {errores.direccion && (
                                                <div className="text-danger mt-1">
                                                    {errores.direccion}
                                                </div>
                                            )}

                                        </div>

                                        {/* ROL */}

                                        <div className="mb-3">

                                            <label
                                                htmlFor="rolUsuarioForm"
                                                className="form-label"
                                            >
                                                Rol
                                            </label>

                                            <select
                                                id="rolUsuarioForm"
                                                name="rol"
                                                className="form-select"
                                                value={formulario.rol}
                                                onChange={cambiarCampo}
                                            >

                                                <option value="">
                                                    Selecciona un rol
                                                </option>

                                                <option value="REPARTIDOR">
                                                    Repartidor
                                                </option>

                                                <option value="DESPACHADORA">
                                                    Operadora / Despachadora
                                                </option>

                                                <option value="CLIENTE">
                                                    Cliente
                                                </option>

                                            </select>

                                            {errores.rol && (
                                                <div className="text-danger mt-1">
                                                    {errores.rol}
                                                </div>
                                            )}

                                        </div>

                                        {mensaje && (
                                            <div
                                                className="alert alert-warning mb-0"
                                                role="alert"
                                            >
                                                {mensaje}
                                            </div>
                                        )}

                                    </div>

                                    {/* BOTONES */}

                                    <div className="modal-footer">

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={cerrarFormulario}
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="submit"
                                            className="btn btn-principal"
                                        >
                                            {
                                                correoEditando
                                                    ? 'Guardar cambios'
                                                    : 'Guardar usuario'
                                            }
                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>

                    </div>

                    <div className="modal-backdrop fade show"></div>

                </>
            )}

            {/* =========================
                MODAL ELIMINAR
            ========================== */}

            {usuarioABorrar && (
                <>

                    <div
                        className="modal fade show"
                        style={{ display: 'block' }}
                        tabIndex="-1"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tituloEliminarUsuario"
                    >

                        <div className="modal-dialog modal-dialog-centered">

                            <div className="modal-content">

                                <div className="modal-header">

                                    <h2
                                        id="tituloEliminarUsuario"
                                        className="modal-title fs-5"
                                    >
                                        ¿Eliminar usuario?
                                    </h2>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Cerrar"
                                        onClick={() =>
                                            setUsuarioABorrar(null)
                                        }
                                    ></button>

                                </div>

                                <div className="modal-body">

                                    <p>
                                        Vas a eliminar la cuenta de:
                                    </p>

                                    <p className="mb-1">
                                        <strong>
                                            {
                                                nombreCompleto(
                                                    usuarioABorrar
                                                )
                                            }
                                        </strong>
                                    </p>

                                    <p className="text-muted">
                                        {usuarioABorrar.correo}
                                    </p>

                                    <p className="mb-0">
                                        Si solo quieres impedir su acceso
                                        temporalmente, puedes usar Desactivar.
                                    </p>

                                </div>

                                <div className="modal-footer">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() =>
                                            setUsuarioABorrar(null)
                                        }
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-peligro"
                                        onClick={confirmarEliminar}
                                    >
                                        Sí, eliminar
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="modal-backdrop fade show"></div>

                </>
            )}

        </main>
    )
}

export default AdminUsuarios