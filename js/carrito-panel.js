const IMAGENES_PANEL = {
    CL001: "img/cl001.jpg",
    CL002: "img/cl002.jpg",
    CL003: "img/cl003.jpg",
    CL004: "img/cl004.jpg",
    RG001: "img/rg001.jpg",
    MG004: "img/mg004.jpg",
    AC001: "img/ac001.jpg",
    AC003: "img/ac003.jpg"
};

function crearPanelCarrito() {
    if (document.getElementById("panelCarrito")) {
        return;
    }

    const panel = document.createElement("div");
    panel.className = "offcanvas offcanvas-end panel-carrito";
    panel.id = "panelCarrito";
    panel.tabIndex = -1;
    panel.setAttribute("aria-labelledby", "tituloPanelCarrito");

    panel.innerHTML =
        '<div class="offcanvas-header panel-cabecera">' +
        '<h2 class="offcanvas-title" id="tituloPanelCarrito">Mi carrito</h2>' +
        '<button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>' +
        "</div>" +
        '<div class="offcanvas-body panel-cuerpo">' +
        '<div class="panel-vacio" id="panelVacio">' +
        '<p class="panel-vacio-titulo">Tu carrito está vacío</p>' +
        "<p>Agrega productos desde el catálogo.</p>" +
        '<a class="btn btn-principal" href="productos.html">Ver el catálogo</a>' +
        "</div>" +
        '<div class="panel-exito d-none" id="panelExito">' +
        '<span class="panel-exito-icono" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "</span>" +
        '<p class="panel-exito-titulo">Pedido registrado</p>' +
        '<p class="panel-exito-numero" id="panelNumeroPedido"></p>' +
        '<dl class="panel-exito-datos">' +
        "<div><dt>Productos</dt><dd id='panelExitoUnidades'></dd></div>" +
        "<div><dt>Total</dt><dd id='panelExitoTotal'></dd></div>" +
        "</dl>" +
        '<p class="panel-exito-nota">Te contactamos al correo o al teléfono registrado para coordinar el despacho.</p>' +
        '<button type="button" class="btn btn-principal boton-ancho" id="panelSeguir">Seguir comprando</button>' +
        "</div>" +
        '<ul class="panel-lista list-unstyled" id="panelLista"></ul>' +
        "</div>" +
        '<div class="panel-pie" id="panelPie">' +
        '<p class="panel-total"><span>Total</span><strong id="panelTotal">$0</strong></p>' +
        '<p class="panel-nota">El despacho se coordina al confirmar el pedido.</p>' +
        '<button type="button" class="btn btn-principal boton-ancho" id="panelPagar">Pagar</button>' +
        '<button type="button" class="enlace-vaciar" id="panelVaciar">Vaciar carrito</button>' +
        "</div>";

    document.body.appendChild(panel);
}

function generarNumeroPedido() {
    const guardado = Number(localStorage.getItem("ultimoPedido") || 1000);
    const siguiente = guardado + 1;
    localStorage.setItem("ultimoPedido", String(siguiente));
    return siguiente;
}

function imagenPanel(codigo) {
    return IMAGENES_PANEL[codigo] || "img/logo.svg";
}

function pintarPanelCarrito() {
    const lista = document.getElementById("panelLista");

    if (!lista) {
        return;
    }

    document.getElementById("panelExito").classList.add("d-none");
    lista.classList.remove("d-none");

    const vacio = document.getElementById("panelVacio");
    const pie = document.getElementById("panelPie");
    const totalTexto = document.getElementById("panelTotal");
    const detalle = detalleCarrito();

    if (detalle.lineas.length === 0) {
        vacio.classList.remove("d-none");
        pie.classList.add("d-none");
        lista.innerHTML = "";
        return;
    }

    vacio.classList.add("d-none");
    pie.classList.remove("d-none");

    lista.innerHTML = detalle.lineas.map(function (linea) {
        const menos = linea.cantidad <= 1 ? " disabled" : "";
        const mas = linea.cantidad >= linea.stock ? " disabled" : "";

        return '<li class="panel-item" data-codigo="' + linea.codigo + '">' +
            '<img src="' + imagenPanel(linea.codigo) + '" alt="' + linea.nombre + '">' +
            '<div class="panel-datos">' +
            "<h3>" + linea.nombre + "</h3>" +
            '<p class="panel-unidad">' + formatearMonto(linea.precio) + " c/u</p>" +
            '<div class="panel-controles">' +
            '<button type="button" class="paso" data-accion="menos" aria-label="Quitar una unidad"' + menos + ">−</button>" +
            '<span class="cantidad-valor">' + linea.cantidad + "</span>" +
            '<button type="button" class="paso" data-accion="mas" aria-label="Agregar una unidad"' + mas + ">+</button>" +
            '<button type="button" class="enlace-quitar" data-accion="quitar">Quitar</button>' +
            "</div>" +
            "</div>" +
            '<strong class="panel-subtotal">' + formatearMonto(linea.subtotal) + "</strong>" +
            "</li>";
    }).join("");

    totalTexto.textContent = formatearMonto(detalle.total);
}

function abrirPanelCarrito() {
    const panel = document.getElementById("panelCarrito");

    if (!panel || typeof bootstrap === "undefined") {
        return;
    }

    pintarPanelCarrito();
    bootstrap.Offcanvas.getOrCreateInstance(panel).show();
}

document.addEventListener("DOMContentLoaded", function () {
    crearPanelCarrito();
    pintarPanelCarrito();

    const panel = document.getElementById("panelCarrito");

    panel.addEventListener("show.bs.offcanvas", pintarPanelCarrito);
    panel.addEventListener("hidden.bs.offcanvas", pintarPanelCarrito);

    panel.addEventListener("click", function (evento) {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) {
            return;
        }

        const item = boton.closest(".panel-item");
        const codigo = item.dataset.codigo;
        const actual = Number(item.querySelector(".cantidad-valor").textContent);
        const accion = boton.dataset.accion;

        if (accion === "quitar") {
            quitarDelCarrito(codigo);
        } else if (accion === "mas") {
            cambiarCantidad(codigo, actual + 1);
        } else if (accion === "menos") {
            cambiarCantidad(codigo, actual - 1);
        }

        pintarPanelCarrito();
    });

    document.getElementById("panelVaciar").addEventListener("click", function () {
        vaciarCarrito();
        pintarPanelCarrito();
    });

    const lista = document.getElementById("panelLista");

    document.getElementById("panelPagar").addEventListener("click", function () {
        const detalle = detalleCarrito();

        if (detalle.lineas.length === 0) {
            return;
        }

        const unidades = detalle.lineas.reduce(function (suma, linea) {
            return suma + linea.cantidad;
        }, 0);

        document.getElementById("panelNumeroPedido").textContent = "N° " + generarNumeroPedido();
        document.getElementById("panelExitoUnidades").textContent =
            unidades === 1 ? "1 producto" : unidades + " productos";
        document.getElementById("panelExitoTotal").textContent = formatearMonto(detalle.total);

        vaciarCarrito();

        lista.classList.add("d-none");
        document.getElementById("panelVacio").classList.add("d-none");
        document.getElementById("panelPie").classList.add("d-none");
        document.getElementById("panelExito").classList.remove("d-none");
    });

    document.getElementById("panelSeguir").addEventListener("click", function () {
        const panelActivo = document.getElementById("panelCarrito");
        bootstrap.Offcanvas.getOrCreateInstance(panelActivo).hide();
    });
});
