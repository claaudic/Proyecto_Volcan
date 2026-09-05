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

        // CARRITO VACÍO
        '<div class="panel-vacio" id="panelVacio">' +
        '<p class="panel-vacio-titulo">Tu carrito está vacío</p>' +
        "<p>Agrega productos desde el catálogo.</p>" +
        '<a class="btn btn-principal" href="productos.html">Ver el catálogo</a>' +
        "</div>" +

        // PEDIDO EXITOSO
        '<div class="panel-exito d-none" id="panelExito">' +
        '<span class="panel-exito-icono" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24">' +
        '<path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        "</svg>" +
        "</span>" +

        '<p class="panel-exito-titulo">Pedido registrado</p>' +
        '<p class="panel-exito-numero" id="panelNumeroPedido"></p>' +

        '<dl class="panel-exito-datos">' +
        "<div>" +
        "<dt>Productos</dt>" +
        "<dd id='panelExitoUnidades'></dd>" +
        "</div>" +

        "<div>" +
        "<dt>Total</dt>" +
        "<dd id='panelExitoTotal'></dd>" +
        "</div>" +
        "</dl>" +

        '<p class="panel-exito-nota">' +
        "Te contactaremos al correo o teléfono registrado para coordinar el despacho." +
        "</p>" +

        '<button type="button" class="btn btn-principal boton-ancho" id="panelSeguir">' +
        "Seguir comprando" +
        "</button>" +
        "</div>" +

        // COMPRA COMO INVITADO
        '<div class="panel-invitado d-none" id="panelInvitado">' +

        '<div class="checkout-cabecera">' +

        '<p class="checkout-etiqueta">FINALIZAR COMPRA</p>' +

        '<h3>¿Cómo quieres continuar?</h3>' +

        '<p>' +
        'Puedes iniciar sesión o realizar tu pedido sin crear una cuenta.' +
        '</p>' +

        "</div>" +


        '<div class="checkout-login">' +

        '<div>' +
        '<strong>¿Ya tienes una cuenta?</strong>' +
        '<span>Ingresa para comprar con tus datos guardados.</span>' +
        "</div>" +

        '<a class="btn checkout-login-boton" href="login.html">' +
        "Iniciar sesión" +
        "</a>" +

        "</div>" +


        '<div class="checkout-separador">' +
        "<span>o compra como invitado</span>" +
        "</div>" +


        '<form id="formCompraInvitado" novalidate>' +

        '<div class="mb-3">' +
        '<label class="form-label" for="invitadoNombre">' +
        "Nombre completo" +
        "</label>" +
        '<input class="form-control" id="invitadoNombre" maxlength="100" required>' +
        "</div>" +

        '<div class="mb-3">' +
        '<label class="form-label" for="invitadoCorreo">' +
        "Correo electrónico" +
        "</label>" +
        '<input class="form-control" id="invitadoCorreo" type="email" maxlength="100" required>' +
        "</div>" +

        '<div class="mb-3">' +
        '<label class="form-label" for="invitadoTelefono">' +
        "Teléfono" +
        "</label>" +
        '<input class="form-control" id="invitadoTelefono" type="tel" maxlength="15" placeholder="+56 9 1234 5678" required>' +
        "</div>" +

        '<div class="mb-3">' +
        '<label class="form-label" for="invitadoDireccion">' +
        "Dirección de entrega" +
        "</label>" +
        '<input class="form-control" id="invitadoDireccion" maxlength="300" required>' +
        "</div>" +

        '<div class="mb-3">' +
        '<label class="form-label" for="invitadoComuna">' +
        "Comuna" +
        "</label>" +

        '<select class="form-select" id="invitadoComuna" required>' +
        '<option value="">Selecciona tu comuna</option>' +
        "<option>Chillán</option>" +
        "<option>Chillán Viejo</option>" +
        "<option>El Carmen</option>" +
        "<option>Pinto</option>" +
        "<option>San Ignacio</option>" +
        "<option>Bulnes</option>" +
        "<option>Quillón</option>" +
        "</select>" +

        "</div>" +

        '<p class="text-danger small d-none" id="errorCompraInvitado"></p>' +

        '<button type="submit" class="btn btn-principal boton-ancho">' +
        "Confirmar pedido" +
        "</button>" +

        '<button type="button" class="enlace-vaciar" id="panelVolverCarrito">' +
        "Volver al carrito" +
        "</button>" +

        "</form>" +

        "</div>" +

        // LISTA DE PRODUCTOS
        '<ul class="panel-lista list-unstyled" id="panelLista"></ul>' +

        "</div>" +

        // PIE DEL CARRITO
        '<div class="panel-pie" id="panelPie">' +

        '<p class="panel-total">' +
        "<span>Total</span>" +
        '<strong id="panelTotal">$0</strong>' +
        "</p>" +

        '<p class="panel-nota">' +
        "El despacho se coordina al confirmar el pedido." +
        "</p>" +

        '<button type="button" class="btn btn-principal boton-ancho" id="panelPagar">' +
        "Pagar" +
        "</button>" +

        '<button type="button" class="enlace-vaciar" id="panelVaciar">' +
        "Vaciar carrito" +
        "</button>" +

        "</div>";

    document.body.appendChild(panel);
}


// ======================================================
// GENERAR NÚMERO DE PEDIDO
// ======================================================

function generarNumeroPedido() {

    const guardado =
        Number(localStorage.getItem("ultimoPedido") || 1000);

    const siguiente = guardado + 1;

    localStorage.setItem(
        "ultimoPedido",
        String(siguiente)
    );

    return siguiente;
}


// ======================================================
// MOSTRAR CARRITO
// ======================================================

function pintarPanelCarrito() {

    const lista =
        document.getElementById("panelLista");

    if (!lista) {
        return;
    }


    document
        .getElementById("panelExito")
        .classList.add("d-none");


    document
        .getElementById("panelInvitado")
        .classList.add("d-none");


    lista.classList.remove("d-none");


    const vacio =
        document.getElementById("panelVacio");

    const pie =
        document.getElementById("panelPie");

    const totalTexto =
        document.getElementById("panelTotal");

    const detalle =
        detalleCarrito();


    if (detalle.lineas.length === 0) {

        vacio.classList.remove("d-none");

        pie.classList.add("d-none");

        lista.innerHTML = "";

        return;
    }


    vacio.classList.add("d-none");

    pie.classList.remove("d-none");


    lista.innerHTML =
        detalle.lineas.map(function (linea) {

            const menos =
                linea.cantidad <= 1
                    ? " disabled"
                    : "";

            const mas =
                linea.cantidad >= linea.stock
                    ? " disabled"
                    : "";


            return (
                '<li class="panel-item" data-codigo="' +
                linea.codigo +
                '">' +

                '<img src="' +
                imagenPorCodigo(linea.codigo) +
                '" alt="' +
                linea.nombre +
                '" onerror="this.src=\'' +
                IMAGEN_RESPALDO +
                '\'">' +

                '<div class="panel-datos">' +

                "<h3>" +
                linea.nombre +
                "</h3>" +

                '<p class="panel-unidad">' +
                formatearMonto(linea.precio) +
                " c/u" +
                "</p>" +

                '<div class="panel-controles">' +

                '<button type="button" class="paso" data-accion="menos" aria-label="Quitar una unidad"' +
                menos +
                ">" +
                "−" +
                "</button>" +

                '<span class="cantidad-valor">' +
                linea.cantidad +
                "</span>" +

                '<button type="button" class="paso" data-accion="mas" aria-label="Agregar una unidad"' +
                mas +
                ">" +
                "+" +
                "</button>" +

                '<button type="button" class="enlace-quitar" data-accion="quitar">' +
                "Quitar" +
                "</button>" +

                "</div>" +
                "</div>" +

                '<strong class="panel-subtotal">' +
                formatearMonto(linea.subtotal) +
                "</strong>" +

                "</li>"
            );

        }).join("");


    totalTexto.textContent =
        formatearMonto(detalle.total);
}


// ======================================================
// ABRIR CARRITO
// ======================================================

function abrirPanelCarrito() {

    const panel =
        document.getElementById("panelCarrito");


    if (
        !panel ||
        typeof bootstrap === "undefined"
    ) {
        return;
    }


    pintarPanelCarrito();


    bootstrap
        .Offcanvas
        .getOrCreateInstance(panel)
        .show();
}


// ======================================================
// CONTAR UNIDADES
// ======================================================

function unidadesDelDetalle(detalle) {

    return detalle.lineas.reduce(
        function (suma, linea) {

            return suma + linea.cantidad;

        },
        0
    );
}


// ======================================================
// MOSTRAR PEDIDO EXITOSO
// ======================================================

function mostrarPedidoRegistrado(
    numero,
    detalle
) {

    const unidades =
        unidadesDelDetalle(detalle);


    document
        .getElementById("panelNumeroPedido")
        .textContent =
        "N° " + numero;


    document
        .getElementById("panelExitoUnidades")
        .textContent =
        unidades === 1
            ? "1 producto"
            : unidades + " productos";


    document
        .getElementById("panelExitoTotal")
        .textContent =
        formatearMonto(detalle.total);


    vaciarCarrito();


    document
        .getElementById("panelLista")
        .classList.add("d-none");


    document
        .getElementById("panelInvitado")
        .classList.add("d-none");


    document
        .getElementById("panelVacio")
        .classList.add("d-none");


    document
        .getElementById("panelPie")
        .classList.add("d-none");


    document
        .getElementById("panelExito")
        .classList.remove("d-none");
}


// ======================================================
// COMPRA DE CLIENTE REGISTRADO
// ======================================================

function registrarPedidoCliente(
    detalle,
    sesionActiva
) {

    const numero =
        generarNumeroPedido();


    descontarStock(detalle.lineas);


    guardarPedido({

        numero: numero,

        fecha:
            new Date().toISOString(),

        tipoCliente:
            "REGISTRADO",

        correo:
            sesionActiva.correo,

        lineas:
            detalle.lineas.map(function (linea) {

                return {

                    codigo:
                        linea.codigo,

                    nombre:
                        linea.nombre,

                    cantidad:
                        linea.cantidad,

                    precio:
                        linea.precio,

                    subtotal:
                        linea.subtotal

                };

            }),

        total:
            detalle.total

    });


    mostrarPedidoRegistrado(
        numero,
        detalle
    );
}


// ======================================================
// MOSTRAR FORMULARIO INVITADO
// ======================================================

function mostrarFormularioInvitado() {

    document
        .getElementById("panelLista")
        .classList.add("d-none");


    document
        .getElementById("panelPie")
        .classList.add("d-none");


    document
        .getElementById("panelVacio")
        .classList.add("d-none");


    document
        .getElementById("panelExito")
        .classList.add("d-none");


    document
        .getElementById("panelInvitado")
        .classList.remove("d-none");


    document
        .getElementById("invitadoNombre")
        .focus();
}


// ======================================================
// VALIDAR INVITADO
// ======================================================

function validarDatosInvitado(datos) {

    if (datos.nombre.length < 2) {

        return "Ingresa tu nombre completo.";

    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(datos.correo)
    ) {

        return "Ingresa un correo válido.";

    }


    if (
        !/^[+0-9\s]{8,15}$/
            .test(datos.telefono)
    ) {

        return "Ingresa un teléfono válido.";

    }


    if (datos.direccion.length < 5) {

        return "Ingresa la dirección donde quieres recibir el pedido.";

    }


    if (datos.comuna === "") {

        return "Selecciona tu comuna.";

    }


    return "";
}


// ======================================================
// REGISTRAR PEDIDO COMO INVITADO
// ======================================================

function registrarPedidoInvitado(
    detalle,
    datos
) {

    const numero =
        generarNumeroPedido();


    descontarStock(detalle.lineas);


    guardarPedido({

        numero:
            numero,

        fecha:
            new Date().toISOString(),

        tipoCliente:
            "INVITADO",

        correo:
            "",

        clienteInvitado: {

            nombre:
                datos.nombre,

            correo:
                datos.correo,

            telefono:
                datos.telefono,

            direccion:
                datos.direccion,

            comuna:
                datos.comuna

        },

        lineas:
            detalle.lineas.map(function (linea) {

                return {

                    codigo:
                        linea.codigo,

                    nombre:
                        linea.nombre,

                    cantidad:
                        linea.cantidad,

                    precio:
                        linea.precio,

                    subtotal:
                        linea.subtotal

                };

            }),

        total:
            detalle.total

    });


    mostrarPedidoRegistrado(
        numero,
        detalle
    );
}


// ======================================================
// EVENTOS
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        crearPanelCarrito();

        pintarPanelCarrito();


        const panel =
            document.getElementById("panelCarrito");


        panel.addEventListener(
            "show.bs.offcanvas",
            pintarPanelCarrito
        );


        panel.addEventListener(
            "hidden.bs.offcanvas",
            pintarPanelCarrito
        );


        // CAMBIAR CANTIDAD
        panel.addEventListener(
            "click",
            function (evento) {

                const boton =
                    evento.target.closest(
                        "button[data-accion]"
                    );


                if (!boton) {
                    return;
                }


                const item =
                    boton.closest(
                        ".panel-item"
                    );


                const codigo =
                    item.dataset.codigo;


                const actual =
                    Number(
                        item
                            .querySelector(
                                ".cantidad-valor"
                            )
                            .textContent
                    );


                const accion =
                    boton.dataset.accion;


                if (accion === "quitar") {

                    quitarDelCarrito(
                        codigo
                    );

                }

                else if (accion === "mas") {

                    cambiarCantidad(
                        codigo,
                        actual + 1
                    );

                }

                else if (accion === "menos") {

                    cambiarCantidad(
                        codigo,
                        actual - 1
                    );

                }


                pintarPanelCarrito();

            }
        );


        // VACIAR
        document
            .getElementById("panelVaciar")
            .addEventListener(
                "click",
                function () {

                    vaciarCarrito();

                    pintarPanelCarrito();

                }
            );


        // PAGAR
        document
            .getElementById("panelPagar")
            .addEventListener(
                "click",
                function () {

                    const detalle =
                        detalleCarrito();


                    if (
                        detalle.lineas.length === 0
                    ) {
                        return;
                    }


                    const sesionActiva =
                        obtenerSesion();


                    // CLIENTE CON CUENTA
                    if (sesionActiva) {

                        registrarPedidoCliente(
                            detalle,
                            sesionActiva
                        );

                        return;
                    }
                    mostrarFormularioInvitado();

                }
            );

        document
            .getElementById("panelVolverCarrito")
            .addEventListener(
                "click",
                function () {

                    pintarPanelCarrito();

                }
            );


        document
            .getElementById("formCompraInvitado")
            .addEventListener(
                "submit",
                function (evento) {

                    evento.preventDefault();


                    const detalle =
                        detalleCarrito();


                    if (
                        detalle.lineas.length === 0
                    ) {

                        pintarPanelCarrito();

                        return;

                    }


                    const datos = {

                        nombre:
                            document
                                .getElementById(
                                    "invitadoNombre"
                                )
                                .value
                                .trim(),

                        correo:
                            document
                                .getElementById(
                                    "invitadoCorreo"
                                )
                                .value
                                .trim()
                                .toLowerCase(),

                        telefono:
                            document
                                .getElementById(
                                    "invitadoTelefono"
                                )
                                .value
                                .trim(),

                        direccion:
                            document
                                .getElementById(
                                    "invitadoDireccion"
                                )
                                .value
                                .trim(),

                        comuna:
                            document
                                .getElementById(
                                    "invitadoComuna"
                                )
                                .value
                                .trim()

                    };


                    const error =
                        validarDatosInvitado(
                            datos
                        );


                    const contenedorError =
                        document.getElementById(
                            "errorCompraInvitado"
                        );


                    if (error !== "") {

                        contenedorError
                            .textContent =
                            error;


                        contenedorError
                            .classList
                            .remove("d-none");


                        return;
                    }


                    contenedorError
                        .textContent =
                        "";


                    contenedorError
                        .classList
                        .add("d-none");


                    registrarPedidoInvitado(
                        detalle,
                        datos
                    );


                    evento
                        .currentTarget
                        .reset();

                }
            );
        document
            .getElementById("panelSeguir")
            .addEventListener(
                "click",
                function () {

                    const panelActivo =
                        document.getElementById(
                            "panelCarrito"
                        );


                    bootstrap
                        .Offcanvas
                        .getOrCreateInstance(
                            panelActivo
                        )
                        .hide();

                }
            );

    }
);