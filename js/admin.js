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


const TEXTOS_PAGINA = {
    "index.html": "Tienes acceso total al sistema. Desde aquí puedes gestionar el catálogo, las cuentas de usuario y las órdenes.",
    "productos.html": "Administra el catálogo: crea productos, edita precios y stock, y desactiva los que dejes de vender.",
    "usuarios.html": "Administra las cuentas del sistema: crea usuarios, asigna roles y desactiva accesos.",
    "ordenes.html": "Revisa las órdenes registradas y su estado de despacho.",
    "reportes.html": "Consulta la información consolidada del catálogo y las ventas."
};

const paginaActualAdmin = window.location.pathname.split("/").pop() || "index.html";

const TEXTO_ADMIN = TEXTOS_PAGINA[paginaActualAdmin] || TEXTOS_PAGINA["index.html"];


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