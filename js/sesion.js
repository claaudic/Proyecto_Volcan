const CLAVE_SESION = "usuarioActivo";

const USUARIOS = [
    {
        nombre: "Claudia Administradora",
        correo: "admin@gasvolcan.cl",
        contrasena: "Admin1234",
        rol: "ADMINISTRADOR"
    },
    {
        nombre: "Vendedor El Volcán",
        correo: "vendedor@gasvolcan.cl",
        contrasena: "Vende1234",
        rol: "VENDEDOR"
    },
    {
        nombre: "Cliente de Prueba",
        correo: "cliente@gmail.com",
        contrasena: "Clien1234",
        rol: "CLIENTE"
    }
];

const DOMINIOS_PERMITIDOS = ["@gasvolcan.cl", "@duoc.cl", "@profesor.duoc.cl", "@gmail.com"];

function obtenerSesion() {
    const guardado = localStorage.getItem(CLAVE_SESION);

    if (!guardado) {
        return null;
    }

    try {
        return JSON.parse(guardado);
    } catch (error) {
        localStorage.removeItem(CLAVE_SESION);
        return null;
    }
}

function guardarSesion(usuario) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
}

function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
}

function validarCorreo(valor) {
    const correo = valor.trim().toLowerCase();

    if (correo === "") {
        return "Ingresa tu correo electrónico.";
    }

    if (correo.length > 100) {
        return "El correo no puede superar los 100 caracteres.";
    }

    const dominioValido = DOMINIOS_PERMITIDOS.some(function (dominio) {
        return correo.endsWith(dominio);
    });

    if (!dominioValido) {
        return "Usa un correo @gasvolcan.cl si eres del equipo, o @gmail.com si eres cliente.";
    }

    return "";
}

function validarContrasena(valor) {
    const contrasena = valor.trim();

    if (contrasena === "") {
        return "Ingresa tu contraseña.";
    }

    if (contrasena.length < 4) {
        return "La contraseña debe tener al menos 4 caracteres.";
    }

    if (contrasena.length > 10) {
        return "La contraseña no puede superar los 10 caracteres.";
    }

    return "";
}

function primerNombre(nombreCompleto) {
    return nombreCompleto.split(" ")[0];
}

function pintarNavCuenta() {
    const contenedor = document.getElementById("navCuenta");

    if (!contenedor) {
        return;
    }

    const usuario = obtenerSesion();

    if (!usuario) {
        contenedor.innerHTML = '<a class="btn btn-cuenta" href="login.html">Ingresar</a>';
        return;
    }

    contenedor.innerHTML =
        '<div class="cuenta-activa">' +
        '<span class="cuenta-saludo">Hola, ' + primerNombre(usuario.nombre) + '</span>' +
        '<button type="button" class="btn btn-cuenta" id="botonCerrarSesion">Salir</button>' +
        '</div>';

    document.getElementById("botonCerrarSesion").addEventListener("click", function () {
        cerrarSesion();
        window.location.reload();
    });
}

document.addEventListener("DOMContentLoaded", pintarNavCuenta);
