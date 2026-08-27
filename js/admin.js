const OPCIONES_MENU = [
    { texto: "Inicio", enlace: "index.html", roles: ["ADMINISTRADOR", "VENDEDOR"] },
    { texto: "Productos", enlace: "productos.html", roles: ["ADMINISTRADOR", "VENDEDOR"] },
    { texto: "Órdenes", enlace: "ordenes.html", roles: ["ADMINISTRADOR", "VENDEDOR"] },
    { texto: "Usuarios", enlace: "usuarios.html", roles: ["ADMINISTRADOR"] }
];

const TEXTOS_ROL = {
    ADMINISTRADOR: "Tienes acceso total al sistema: puedes crear, editar y eliminar productos y usuarios, y revisar todas las órdenes.",
    VENDEDOR: "Puedes revisar el listado de productos y el de órdenes, junto con su detalle. El resto de las opciones no aparece en tu menú."
};

const sesion = obtenerSesion();

if (!sesion || sesion.rol === "CLIENTE") {
    window.location.replace("../login.html");
} else {
    dibujarPanel(sesion);
}

function dibujarPanel(usuario) {
    const menu = document.getElementById("menuAdmin");
    const paginaActual = window.location.pathname.split("/").pop() || "index.html";

    const opciones = OPCIONES_MENU.filter(function (opcion) {
        return opcion.roles.includes(usuario.rol);
    });

    menu.innerHTML = opciones.map(function (opcion) {
        const activo = opcion.enlace === paginaActual ? " admin-enlace-activo" : "";
        return '<li><a class="admin-enlace' + activo + '" href="' + opcion.enlace + '">' + opcion.texto + '</a></li>';
    }).join("");

    document.getElementById("saludoAdmin").textContent = "Hola, " + usuario.nombre;
    document.getElementById("usuarioNombre").textContent = usuario.nombre;
    document.getElementById("usuarioRol").textContent = etiquetaRol(usuario.rol);
    document.getElementById("textoAviso").textContent = TEXTOS_ROL[usuario.rol];

    document.getElementById("botonSalir").addEventListener("click", function () {
        cerrarSesion();
        window.location.href = "../login.html";
    });
}

function etiquetaRol(rol) {
    if (rol === "ADMINISTRADOR") {
        return "Administrador";
    }

    if (rol === "VENDEDOR") {
        return "Vendedor";
    }

    return "Cliente";
}
