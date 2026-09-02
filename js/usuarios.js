const CLAVE_USUARIOS_SISTEMA = "usuariosSistema";

const tablaUsuarios = document.getElementById("tablaUsuarios");
const btnNuevoUsuario = document.getElementById("btnNuevoUsuario");

const formUsuario = document.getElementById("formUsuario");

const usuarioId = document.getElementById("usuarioId");
const nombreUsuario = document.getElementById("nombreUsuario");
const correoUsuario = document.getElementById("correoUsuario");
const contrasenaUsuario = document.getElementById("contrasenaUsuario");
const rolUsuarioForm = document.getElementById("rolUsuarioForm");

const errorNombre = document.getElementById("errorNombre");
const errorCorreo = document.getElementById("errorCorreo");
const errorContrasena = document.getElementById("errorContrasena");
const errorRol = document.getElementById("errorRol");

const tituloModalUsuario = document.getElementById("tituloModalUsuario");

const modalUsuario = new bootstrap.Modal(
    document.getElementById("modalUsuario")
);


// ==========================================
// CARGAR USUARIOS
// ==========================================

function obtenerUsuariosSistema() {

    const guardados =
        localStorage.getItem(CLAVE_USUARIOS_SISTEMA);

    let usuariosSistema = [];

    if (guardados) {

        try {
            usuariosSistema = JSON.parse(guardados);

            if (!Array.isArray(usuariosSistema)) {
                usuariosSistema = [];
            }

        } catch (error) {
            usuariosSistema = [];
        }
    }


    // ==========================================
    // MIGRAR DOMINIO ANTIGUO AL NUEVO
    // @gasvolcan.cl -> @gaselvolcan.cl
    // ==========================================

    usuariosSistema.forEach(function (usuario) {

        if (!usuario.correo) {
            return;
        }

        usuario.correo =
            usuario.correo
                .trim()
                .toLowerCase()
                .replace(
                    "@gasvolcan.cl",
                    "@gaselvolcan.cl"
                );

    });


    // ==========================================
    // ELIMINAR DUPLICADOS POR CORREO
    // ==========================================

    const correosEncontrados = [];

    usuariosSistema =
        usuariosSistema.filter(function (usuario) {

            const correo =
                usuario.correo.trim().toLowerCase();

            if (correosEncontrados.includes(correo)) {
                return false;
            }

            correosEncontrados.push(correo);

            return true;

        });


    // ==========================================
    // AGREGAR USUARIOS BASE QUE FALTEN
    // ==========================================

    let siguienteId = 1;

    if (usuariosSistema.length > 0) {

        siguienteId =
            Math.max(
                ...usuariosSistema.map(function (usuario) {
                    return Number(usuario.id) || 0;
                })
            ) + 1;
    }


    USUARIOS.forEach(function (usuarioBase) {

        const correoBase =
            usuarioBase.correo
                .trim()
                .toLowerCase();

        const existe =
            usuariosSistema.some(function (usuario) {

                return (
                    usuario.correo
                        .trim()
                        .toLowerCase()
                    === correoBase
                );

            });


        if (!existe && !cuentaEliminada(correoBase)) {

            usuariosSistema.push({

                id: siguienteId,
                nombre: usuarioBase.nombre,
                correo: correoBase,
                contrasena: usuarioBase.contrasena,
                rol: usuarioBase.rol,
                activo: true

            });

            siguienteId++;

        }

    });


    guardarUsuariosSistema(
        usuariosSistema
    );

    return usuariosSistema;
}


// ==========================================
// GUARDAR USUARIOS
// ==========================================

function guardarUsuariosSistema(usuarios) {

    localStorage.setItem(
        CLAVE_USUARIOS_SISTEMA,
        JSON.stringify(usuarios)
    );

}


// ==========================================
// MOSTRAR USUARIOS EN TABLA
// ==========================================

function mostrarUsuarios() {

    const usuarios = obtenerUsuariosSistema();

    tablaUsuarios.innerHTML = "";

    usuarios.forEach(function (usuario) {

        const fila = document.createElement("tr");

        const estadoTexto =
            usuario.activo
                ? "Activo"
                : "Inactivo";

        const estadoClase =
            usuario.activo
                ? "bg-success"
                : "bg-secondary";

        fila.innerHTML = `
            <td>
                <strong>${usuario.nombre}</strong>
            </td>

            <td>
                ${usuario.correo}
            </td>

            <td>
                ${obtenerNombreRol(usuario.rol)}
            </td>

            <td>
                <span class="badge ${estadoClase}">
                    ${estadoTexto}
                </span>
            </td>

            <td>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary me-1"
                    onclick="editarUsuario(${usuario.id})"
                >
                    Editar
                </button>

                <button
                    type="button"
                    class="btn btn-sm ${
                        usuario.activo
                            ? "btn-outline-warning"
                            : "btn-outline-success"
                    } me-1"
                    onclick="cambiarEstadoUsuario(${usuario.id})"
                >
                    ${
                        usuario.activo
                            ? "Desactivar"
                            : "Activar"
                    }
                </button>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    onclick="eliminarUsuario(${usuario.id})"
                >
                    Eliminar
                </button>

            </td>
        `;

        tablaUsuarios.appendChild(fila);

    });

}


// ==========================================
// BOTÓN CREAR USUARIO
// ==========================================

btnNuevoUsuario.addEventListener("click", function () {

    limpiarFormulario();

    tituloModalUsuario.textContent =
        "Crear usuario";

    contrasenaUsuario.required = true;

    modalUsuario.show();

});


// ==========================================
// GUARDAR / EDITAR USUARIO
// ==========================================

formUsuario.addEventListener("submit", function (event) {

    event.preventDefault();

    limpiarErrores();

    const nombre = nombreUsuario.value.trim();
    const correo = correoUsuario.value.trim().toLowerCase();
    const contrasena = contrasenaUsuario.value.trim();
    const rol = rolUsuarioForm.value;

    const id = Number(usuarioId.value);

    let formularioValido = true;


    // NOMBRE

    if (nombre === "") {

        errorNombre.textContent =
            "Ingresa el nombre del usuario.";

        formularioValido = false;

    }

    else if (nombre.length > 50) {

        errorNombre.textContent =
            "El nombre no puede superar los 50 caracteres.";

        formularioValido = false;

    }


    // CORREO

    if (correo === "") {

        errorCorreo.textContent =
            "Ingresa un correo.";

        formularioValido = false;

    }

    else if (correo.length > 100) {

        errorCorreo.textContent =
            "El correo no puede superar los 100 caracteres.";

        formularioValido = false;

    }


    // ROL

    if (rol === "") {

        errorRol.textContent =
            "Selecciona un rol.";

        formularioValido = false;

    }


    // CONTRASEÑA

    if (!id || contrasena !== "") {

        if (contrasena.length < 4) {

            errorContrasena.textContent =
                "La contraseña debe tener al menos 4 caracteres.";

            formularioValido = false;

        }

        else if (contrasena.length > 10) {

            errorContrasena.textContent =
                "La contraseña no puede superar los 10 caracteres.";

            formularioValido = false;

        }

    }


    if (!formularioValido) {
        return;
    }


    const usuarios = obtenerUsuariosSistema();


    // EVITAR CORREOS REPETIDOS

    const correoExiste = usuarios.some(function (usuario) {

        return (
            usuario.correo.toLowerCase() === correo
            &&
            usuario.id !== id
        );

    });


    if (correoExiste) {

        errorCorreo.textContent =
            "Ya existe un usuario con ese correo.";

        return;

    }


    // EDITAR

    if (id) {

        const usuario = usuarios.find(function (usuario) {

            return usuario.id === id;

        });


        if (!usuario) {
            return;
        }


        usuario.nombre = nombre;
        usuario.correo = correo;
        usuario.rol = rol;


        if (contrasena !== "") {
            usuario.contrasena = contrasena;
        }

    }


    // CREAR

    else {

        const nuevoId =
            usuarios.length > 0
                ? Math.max(
                    ...usuarios.map(function (usuario) {
                        return usuario.id;
                    })
                ) + 1
                : 1;


        usuarios.push({

            id: nuevoId,
            nombre: nombre,
            correo: correo,
            contrasena: contrasena,
            rol: rol,
            activo: true

        });

    }


    guardarUsuariosSistema(usuarios);

    mostrarUsuarios();

    modalUsuario.hide();

});


// ==========================================
// EDITAR USUARIO
// ==========================================

function editarUsuario(id) {

    const usuarios = obtenerUsuariosSistema();

    const usuario = usuarios.find(function (usuario) {

        return usuario.id === id;

    });


    if (!usuario) {
        return;
    }


    limpiarFormulario();

    usuarioId.value = usuario.id;
    nombreUsuario.value = usuario.nombre;
    correoUsuario.value = usuario.correo;
    rolUsuarioForm.value = usuario.rol;

    contrasenaUsuario.value = "";
    contrasenaUsuario.required = false;

    contrasenaUsuario.placeholder =
        "Déjala vacía para mantenerla";

    tituloModalUsuario.textContent =
        "Editar usuario";

    modalUsuario.show();

}


// ==========================================
// ACTIVAR / DESACTIVAR
// ==========================================

function cambiarEstadoUsuario(id) {

    const usuarios = obtenerUsuariosSistema();

    const usuario = usuarios.find(function (usuario) {

        return usuario.id === id;

    });


    if (!usuario) {
        return;
    }


    const sesionActual = obtenerSesion();


    if (
        sesionActual &&
        usuario.correo === sesionActual.correo
    ) {

        alert(
            "No puedes desactivar tu propia cuenta."
        );

        return;

    }


    usuario.activo = !usuario.activo;

    guardarUsuariosSistema(usuarios);

    mostrarUsuarios();

}


// ==========================================
// ELIMINAR USUARIO
// ==========================================

function eliminarUsuario(id) {

    const usuarios = obtenerUsuariosSistema();

    const usuario = usuarios.find(function (usuario) {

        return usuario.id === id;

    });


    if (!usuario) {
        return;
    }


    const sesionActual = obtenerSesion();


    if (
        sesionActual &&
        usuario.correo === sesionActual.correo
    ) {

        alert(
            "No puedes eliminar tu propia cuenta."
        );

        return;

    }


    const confirmar = confirm(
        "¿Seguro que deseas eliminar a " +
        usuario.nombre +
        "?"
    );


    if (!confirmar) {
        return;
    }


    const usuariosActualizados =
        usuarios.filter(function (usuarioActual) {

            return usuarioActual.id !== id;

        });


    marcarCuentaEliminada(usuario.correo);

    guardarUsuariosSistema(
        usuariosActualizados
    );

    mostrarUsuarios();

}


// ==========================================
// MOSTRAR NOMBRE DEL ROL
// ==========================================

function obtenerNombreRol(rol) {

    if (rol === "ADMINISTRADOR") {
        return "Administrador";
    }

    if (rol === "DESPACHADORA") {
        return "Despachadora";
    }

    if (rol === "REPARTIDOR") {
        return "Repartidor";
    }

    if (rol === "CLIENTE") {
        return "Cliente";
    }

    return rol;

}


// ==========================================
// LIMPIAR FORMULARIO
// ==========================================

function limpiarFormulario() {

    formUsuario.reset();

    usuarioId.value = "";

    contrasenaUsuario.required = true;

    contrasenaUsuario.placeholder = "";

    limpiarErrores();

}


// ==========================================
// LIMPIAR ERRORES
// ==========================================

function limpiarErrores() {

    errorNombre.textContent = "";
    errorCorreo.textContent = "";
    errorContrasena.textContent = "";
    errorRol.textContent = "";

}


// ==========================================
// INICIAR
// ==========================================

mostrarUsuarios();