document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // PROTEGER LA PÁGINA POR ROL
    // ==========================================

    const usuario = obtenerSesion();

    if (!usuario || usuario.rol !== "REPARTIDOR") {
        window.location.href = "login.html";
        return;
    }


    // ==========================================
    // OBTENER PEDIDOS
    // ==========================================

    const pedidos = document.querySelectorAll("#tablaPedidos tr");


    pedidos.forEach(function (pedido) {

        const selector = pedido.querySelector(".selector-estado");
        const etiqueta = pedido.querySelector(".estado");

        const numeroPedido = pedido
            .querySelector("strong")
            .textContent
            .replace("#", "");

        const clavePedido = "estadoPedido_" + numeroPedido;


        // ==========================================
        // RECUPERAR ESTADO GUARDADO
        // ==========================================

        const estadoGuardado = localStorage.getItem(clavePedido);

        if (estadoGuardado) {
            pedido.dataset.estado = estadoGuardado;
            selector.value = estadoGuardado;

            pintarEstado(
                pedido,
                etiqueta,
                selector,
                estadoGuardado
            );
        } else {

            pintarEstado(
                pedido,
                etiqueta,
                selector,
                pedido.dataset.estado
            );
        }


        // ==========================================
        // CAMBIAR ESTADO
        // ==========================================

        selector.addEventListener("change", function () {

            const nuevoEstado = selector.value;

            pedido.dataset.estado = nuevoEstado;

            localStorage.setItem(
                clavePedido,
                nuevoEstado
            );

            pintarEstado(
                pedido,
                etiqueta,
                selector,
                nuevoEstado
            );

            actualizarResumen();
        });

    });


    actualizarResumen();


    // ==========================================
    // PINTAR ESTADO
    // ==========================================

    function pintarEstado(
        pedido,
        etiqueta,
        selector,
        estado
    ) {

        etiqueta.className = "estado";


        if (estado === "pendiente") {

            etiqueta.textContent = "Pendiente";

            etiqueta.classList.add(
                "estado-pendiente"
            );

            selector.disabled = false;

        }


        else if (estado === "camino") {

            etiqueta.textContent = "En camino";

            etiqueta.classList.add(
                "estado-camino"
            );

            selector.disabled = false;

            // Ya no puede volver a pendiente
            const opcionPendiente =
                selector.querySelector(
                    'option[value="pendiente"]'
                );

            if (opcionPendiente) {
                opcionPendiente.disabled = true;
            }

        }


        else if (estado === "entregado") {

            etiqueta.textContent = "Entregado";

            etiqueta.classList.add(
                "estado-entregado"
            );

            // Una entrega terminada ya no se modifica
            selector.disabled = true;

        }

    }


    // ==========================================
    // ACTUALIZAR CONTADORES
    // ==========================================

    function actualizarResumen() {

        let pendientes = 0;
        let camino = 0;
        let entregados = 0;


        pedidos.forEach(function (pedido) {

            const estado = pedido.dataset.estado;


            if (estado === "pendiente") {
                pendientes++;
            }

            else if (estado === "camino") {
                camino++;
            }

            else if (estado === "entregado") {
                entregados++;
            }

        });


        document.getElementById(
            "totalPendientes"
        ).textContent = pendientes;


        document.getElementById(
            "totalCamino"
        ).textContent = camino;


        document.getElementById(
            "totalEntregados"
        ).textContent = entregados;

    }

});