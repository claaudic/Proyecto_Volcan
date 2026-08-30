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

    dibujarPanel();

}


function dibujarPanel() {

    const menu = document.getElementById("menuAdmin");


    if (menu) {

        menu.innerHTML = OPCIONES_MENU.map(function (opcion) {

            const activo =
                opcion.enlace === paginaActualAdmin
                    ? " active"
                    : "";

            return `
                <li class="nav-item">
                    <a
                        class="nav-link${activo}"
                        href="${opcion.enlace}"
                    >
                        ${opcion.texto}
                    </a>
                </li>
            `;

        }).join("") + '<li class="nav-item nav-cuenta" id="navCuenta"></li>';


        pintarNavCuenta();

    }


    const aviso = document.getElementById("textoAviso");

    if (aviso) {
        aviso.textContent = TEXTO_ADMIN;
    }


    mostrarResumenAdmin();

}


// ==========================================
// CIFRAS DEL PANEL DE INICIO
// ==========================================

function mostrarResumenAdmin() {

    const casillaProductos = document.getElementById("totalProductos");

    if (!casillaProductos) {
        return;
    }


    const productos =
        typeof obtenerCatalogo === "function"
            ? obtenerCatalogo()
            : [];


    const categorias = [];

    productos.forEach(function (producto) {

        if (categorias.indexOf(producto.categoria) === -1) {
            categorias.push(producto.categoria);
        }

    });


    casillaProductos.textContent = productos.length;

    document.getElementById("totalCategorias").textContent =
        categorias.length;

    document.getElementById("totalUsuarios").textContent =
        contarUsuarios();

}


function contarUsuarios() {

    const guardados = localStorage.getItem("usuariosSistema");

    let correos = [];


    if (guardados) {

        try {

            const lista = JSON.parse(guardados);

            if (Array.isArray(lista)) {

                correos = lista.map(function (usuario) {
                    return String(usuario.correo).toLowerCase();
                });

            }

        } catch (error) {
            correos = [];
        }

    }


    USUARIOS.forEach(function (base) {

        if (correos.indexOf(base.correo.toLowerCase()) === -1) {
            correos.push(base.correo.toLowerCase());
        }

    });


    return correos.length;

}
