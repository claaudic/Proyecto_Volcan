const CLAVE_SESION = "usuarioActivo";

const USUARIOS = [
    
    {
        nombre: "Claudia Administradora",
        correo: "admin@gaselvolcan.cl",
        contrasena: "Admin1234",
        rol: "ADMINISTRADOR"
    },
     {
        nombre: "Daniela Despachadora",
        correo: "despachadora@gaselvolcan.cl",
        contrasena: "Desp123",
        rol: "DESPACHADORA"
    },
    {
        nombre: "Repartidor El Volcán",
        correo: "repartidor@gaselvolcan.cl",
        contrasena: "Repart123",
        rol: "REPARTIDOR"
    },
    {
        nombre: "Cliente de Prueba",
        correo: "cliente@gmail.com",
        contrasena: "Clien1234",
        rol: "CLIENTE"
    }
];

const DOMINIOS_PERMITIDOS = ["@gaselvolcan.cl", "@duoc.cl", "@profesor.duoc.cl", "@gmail.com"];

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
        return "Usa un correo @gaselvolcan.cl si eres del equipo, o @gmail.com si eres cliente.";
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

    // Si no hay sesión iniciada
    if (!usuario) {
        contenedor.innerHTML =
            '<a class="btn btn-cuenta" href="login.html">Ingresar</a>';

        return;
    }

    // ==========================================
    // PANEL SEGÚN ROL
    // ==========================================

    let enlacePanel = "";

    if (usuario.rol === "ADMINISTRADOR") {
        enlacePanel = "admin/index.html";
    }

    else if (usuario.rol === "DESPACHADORA") {
        enlacePanel = "despachadora.html";
    }

    else if (usuario.rol === "REPARTIDOR") {
        enlacePanel = "repartidor.html";
    }


    // ==========================================
    // BOTÓN PANEL
    // ==========================================

    let botonPanel = "";

    if (enlacePanel !== "") {

        botonPanel =
            '<a class="btn btn-cuenta" href="' +
            enlacePanel +
            '">Panel</a>';

    }


    // ==========================================
    // MOSTRAR CUENTA
    // ==========================================

    contenedor.innerHTML =
        '<div class="cuenta-activa">' +

            '<span class="cuenta-saludo">' +
                'Hola, ' +
                primerNombre(usuario.nombre) +
            '</span>' +

            botonPanel +

            '<button type="button" ' +
                'class="btn btn-cuenta" ' +
                'id="botonCerrarSesion">' +
                'Salir' +
            '</button>' +

        '</div>';


    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    document
        .getElementById("botonCerrarSesion")
        .addEventListener("click", function () {

            cerrarSesion();
            window.location.reload();

        });
}
document.addEventListener("DOMContentLoaded", pintarNavCuenta);
