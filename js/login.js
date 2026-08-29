const formLogin = document.getElementById("formLogin");
const correoInput = document.getElementById("correo");
const contrasenaInput = document.getElementById("contrasena");
const errorCorreo = document.getElementById("errorCorreo");
const errorContrasena = document.getElementById("errorContrasena");
const mensajeLogin = document.getElementById("mensajeLogin");
const mostrarContrasena = document.getElementById("mostrarContrasena");
const sugerenciaCorreo = document.getElementById("sugerenciaCorreo");

mostrarContrasena.addEventListener("click", function () {
    if (contrasenaInput.type === "password") {
        contrasenaInput.type = "text";
        mostrarContrasena.textContent = "Ocultar";
    } else {
        contrasenaInput.type = "password";
        mostrarContrasena.textContent = "Mostrar";
    }
});

function pintarEstado(campo, contenedorError, mensaje) {
    contenedorError.textContent = mensaje;

    if (campo.value.trim() === "") {
        campo.classList.remove("campo-valido", "campo-invalido");
        return;
    }

    if (mensaje === "") {
        campo.classList.add("campo-valido");
        campo.classList.remove("campo-invalido");
    } else {
        campo.classList.add("campo-invalido");
        campo.classList.remove("campo-valido");
    }
}

correoInput.addEventListener("input", function () {
    ocultarMensajeGeneral();
    pintarEstado(correoInput, errorCorreo, validarCorreo(correoInput.value));
    mostrarSugerencia(correoInput.value);
});

sugerenciaCorreo.addEventListener("click", function () {
    correoInput.value = sugerenciaCorreo.dataset.correo;
    correoInput.focus();
    pintarEstado(correoInput, errorCorreo, validarCorreo(correoInput.value));
    ocultarSugerencia();
});

function mostrarSugerencia(valor) {
    const correo = valor.trim().toLowerCase();
    const posicion = correo.indexOf("@");

    if (posicion < 1 || validarCorreo(correo) === "") {
        ocultarSugerencia();
        return;
    }

    const propuesta = correo.slice(0, posicion) + "@gaselvolcan.cl";
    sugerenciaCorreo.dataset.correo = propuesta;
    sugerenciaCorreo.textContent = "¿Quisiste decir " + propuesta + "?";
    sugerenciaCorreo.classList.remove("d-none");
}

function ocultarSugerencia() {
    sugerenciaCorreo.classList.add("d-none");
    sugerenciaCorreo.textContent = "";
}

contrasenaInput.addEventListener("input", function () {
    ocultarMensajeGeneral();
    pintarEstado(contrasenaInput, errorContrasena, validarContrasena(contrasenaInput.value));
});

formLogin.addEventListener("submit", function (evento) {
    evento.preventDefault();
    ocultarMensajeGeneral();

    const errorEnCorreo = validarCorreo(correoInput.value);
    const errorEnContrasena = validarContrasena(contrasenaInput.value);

    pintarEstado(correoInput, errorCorreo, errorEnCorreo);
    pintarEstado(contrasenaInput, errorContrasena, errorEnContrasena);

    mostrarSugerencia(correoInput.value);

    if (errorEnCorreo !== "" || errorEnContrasena !== "") {
        if (errorEnCorreo !== "") {
            correoInput.focus();
        } else {
            contrasenaInput.focus();
        }
        return;
    }

    const correo = correoInput.value.trim().toLowerCase();
    const contrasena = contrasenaInput.value.trim();

    const usuariosDisponibles = obtenerUsuariosDisponibles();

const usuarioEncontrado = usuariosDisponibles.find(function (usuario) {

    return (
        usuario.correo.toLowerCase() === correo &&
        usuario.contrasena === contrasena
    );

});

if (!usuarioEncontrado) {

    mostrarMensajeGeneral(
        "El correo o la contraseña son incorrectos."
    );

    return;
}

if (usuarioEncontrado.activo === false) {

    mostrarMensajeGeneral(
        "Tu cuenta está desactivada. Contacta al administrador."
    );

    return;
}

    guardarSesion({
        nombre: usuarioEncontrado.nombre,
        correo: usuarioEncontrado.correo,
        rol: usuarioEncontrado.rol
    });

    redirigirSegunRol(usuarioEncontrado.rol);
});

function obtenerUsuariosDisponibles() {
    const guardados = localStorage.getItem("usuariosSistema");
    let usuarios = [];

    if (guardados) {
        try {
            const lista = JSON.parse(guardados);

            if (Array.isArray(lista)) {
                usuarios = lista;
            }
        } catch (error) {
            usuarios = [];
        }
    }

    USUARIOS.forEach(function (base) {
        const yaExiste = usuarios.some(function (usuario) {
            return String(usuario.correo).toLowerCase() === base.correo.toLowerCase();
        });

        if (!yaExiste) {
            usuarios.push(base);
        }
    });

    return usuarios;
}

function mostrarMensajeGeneral(texto) {
    mensajeLogin.textContent = texto;
    mensajeLogin.classList.remove("d-none");
}

function ocultarMensajeGeneral() {
    mensajeLogin.textContent = "";
    mensajeLogin.classList.add("d-none");
}

function redirigirSegunRol(rol) {

    if (rol === "ADMINISTRADOR") {

        window.location.href =
            "admin/index.html";

    }

    else if (rol === "DESPACHADORA") {

        window.location.href =
            "despachadora.html";

    }

    else if (rol === "REPARTIDOR") {

        window.location.href =
            "repartidor.html";

    }

    else {

        window.location.href =
            "index.html";

    }

}