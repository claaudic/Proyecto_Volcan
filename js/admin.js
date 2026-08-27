const OPCIONES_MENU = [
    {
        texto: "Inicio",
        enlace: "index.html"
    },
    {
        texto: "Productos",
        enlace: "productos.html"
    },
    {
        texto: "Órdenes",
        enlace: "ordenes.html"
    },
    {
        texto: "Usuarios",
        enlace: "usuarios.html"
    },
    {
        texto: "Reportes",
        enlace: "reportes.html"
    }
];


const TEXTO_ADMIN =
    "Tienes acceso total al sistema. Puedes crear, editar y desactivar usuarios, asignar roles y revisar todos los reportes y datos del sistema.";


// ==========================================
// COMPROBAR SESIÓN
// ==========================================

const sesion = obtenerSesion();


// Solo el ADMINISTRADOR puede entrar al panel
if (!sesion || sesion.rol !== "ADMINISTRADOR") {

    window.location.replace("../login.html");

} else {

    dibujarPanel(sesion);

}


function dibujarPanel(usuario) {

    const menu = document.getElementById("menuAdmin");

    const paginaActual =
        window.location.pathname.split("/").pop() || "index.html";


    
    menu.innerHTML = OPCIONES_MENU.map(function (opcion) {

        const activo =
            opcion.enlace === paginaActual
                ? " admin-enlace-activo"
                : "";

        return `
            <li>
                <a
                    class="admin-enlace${activo}"
                    href="${opcion.enlace}"
                >
                    ${opcion.texto}
                </a>
            </li>
        `;

    }).join("");


const saludo = document.getElementById("saludoAdmin");
const nombreUsuario = document.getElementById("usuarioNombre");
const rolUsuario = document.getElementById("usuarioRol");
const aviso = document.getElementById("textoAviso");

if (saludo) {
    saludo.textContent = "Hola, " + usuario.nombre;
}

if (nombreUsuario) {
    nombreUsuario.textContent = usuario.nombre;
}

if (rolUsuario) {
    rolUsuario.textContent = "Administrador";
}

if (aviso) {
    aviso.textContent = TEXTO_ADMIN;
}

    
const botonSalir = document.getElementById("botonSalir");

if (botonSalir) {

    botonSalir.addEventListener("click", function () {

        cerrarSesion();

        window.location.href = "../login.html";

    });

}
}