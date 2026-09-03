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
// TABLERO DE INICIO
// ==========================================

function mostrarResumenAdmin() {

    const casilla = document.getElementById("totalPendientes");

    if (!casilla || typeof obtenerPedidosSistema !== "function") {
        return;
    }


    const pedidos = obtenerPedidosSistema();

    const productos =
        typeof obtenerCatalogoActivo === "function"
            ? obtenerCatalogoActivo()
            : [];


    // ======================================
    // LAS CUATRO CIFRAS
    // ======================================

    const pendientes = pedidos.filter(function (pedido) {
        return pedido.estado === "pendiente";
    }).length;


    const sinRepartidor = pedidos.filter(function (pedido) {
        return !pedido.repartidor;
    }).length;


    const porStock = productos.slice().sort(function (uno, otro) {
        return Number(uno.stock) - Number(otro.stock);
    });


    const total = pedidos.reduce(function (suma, pedido) {

        if (pedido.estado === "cancelado") {
            return suma;
        }

        return suma + Number(pedido.total || 0);

    }, 0);


    casilla.textContent = pendientes;

    document.getElementById("totalSinRepartidor").textContent = sinRepartidor;

    document.getElementById("stockMasBajo").textContent =
        porStock.length > 0 ? porStock[0].stock : 0;

    document.getElementById("totalVendido").textContent = formatearPesos(total);


    mostrarUltimosPedidos(pedidos);
    mostrarStockBajo(porStock);

}


function mostrarUltimosPedidos(pedidos) {

    const cuerpo = document.getElementById("tablaUltimosPedidos");

    if (!cuerpo) {
        return;
    }


    if (pedidos.length === 0) {

        cuerpo.innerHTML =
            '<tr><td colspan="5">Todavía no hay pedidos registrados.</td></tr>';

        return;
    }


    cuerpo.innerHTML = pedidos.slice(0, 5).map(function (pedido) {

        return `
            <tr>
                <td><strong>#${pedido.numero}</strong></td>
                <td>${pedido.cliente}</td>
                <td>${pedido.comuna}</td>
                <td>
                    <span class="estado ${claseDeEstado(pedido.estado)}">
                        ${textoDeEstado(pedido.estado)}
                    </span>
                </td>
                <td>${formatearPesos(pedido.total)}</td>
            </tr>
        `;

    }).join("");

}


function mostrarStockBajo(productosOrdenados) {

    const cuerpo = document.getElementById("tablaStockBajo");

    if (!cuerpo) {
        return;
    }


    if (productosOrdenados.length === 0) {

        cuerpo.innerHTML =
            '<tr><td colspan="3">No hay productos en el catálogo.</td></tr>';

        return;
    }


    cuerpo.innerHTML = productosOrdenados.slice(0, 5).map(function (producto) {

        return `
            <tr>
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td><strong>${producto.stock}</strong></td>
            </tr>
        `;

    }).join("");

}
