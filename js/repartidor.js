document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // PROTEGER LA PÁGINA POR ROL
    // ==========================================

    const usuario = obtenerSesion();

    if (!usuario || usuario.rol !== "REPARTIDOR") {
        window.location.href = "login.html";
        return;
    }


    const cuerpoTabla = document.getElementById("tablaPedidos");
    const sinPedidos = document.getElementById("sinRuta");


    // ==========================================
    // DIBUJAR LA RUTA DEL REPARTIDOR
    // ==========================================

    function dibujarRuta() {

        const pedidos = pedidosDelRepartidor(usuario.correo);


        if (pedidos.length === 0) {

            cuerpoTabla.innerHTML = "";
            sinPedidos.classList.remove("d-none");

            actualizarResumen(pedidos);

            return;
        }


        sinPedidos.classList.add("d-none");


        cuerpoTabla.innerHTML = pedidos.map(function (pedido) {

            return `
                <tr data-estado="${pedido.estado}">

                    <td><strong>#${pedido.numero}</strong></td>

                    <td>${pedido.cliente}</td>

                    <td>${pedido.direccion}, ${pedido.comuna}</td>

                    <td>${pedido.cantidad} × ${pedido.producto}</td>

                    <td>
                        <span class="estado ${claseDeEstado(pedido.estado)}">
                            ${textoDeEstado(pedido.estado)}
                        </span>
                    </td>

                    <td>
                        <select
                            class="selector-estado"
                            data-pedido="${pedido.numero}"
                            aria-label="Cambiar el estado del pedido ${pedido.numero}"
                        >
                            <option value="pendiente">Pendiente</option>
                            <option value="camino">En camino</option>
                            <option value="entregado">Entregado</option>
                        </select>
                    </td>

                </tr>
            `;

        }).join("");


        cuerpoTabla.querySelectorAll("tr").forEach(function (fila) {
            prepararFila(fila);
        });


        actualizarResumen(pedidos);

    }


    // ==========================================
    // REGLAS DE CADA FILA
    // ==========================================

    function prepararFila(fila) {

        const selector = fila.querySelector(".selector-estado");
        const estado = fila.dataset.estado;

        selector.value = estado;


        // Una entrega terminada ya no se modifica
        if (estado === "entregado") {
            selector.disabled = true;
        }


        // Ya no puede volver a pendiente
        if (estado === "camino") {
            selector.querySelector('option[value="pendiente"]').disabled = true;
        }


        selector.addEventListener("change", function () {

            localStorage.setItem(
                CLAVE_ESTADO_PEDIDO + selector.dataset.pedido,
                selector.value
            );

            dibujarRuta();

        });

    }


    // ==========================================
    // ACTUALIZAR CONTADORES
    // ==========================================

    function actualizarResumen(pedidos) {

        let pendientes = 0;
        let camino = 0;
        let entregados = 0;


        pedidos.forEach(function (pedido) {

            if (pedido.estado === "pendiente") {
                pendientes++;
            }

            else if (pedido.estado === "camino") {
                camino++;
            }

            else if (pedido.estado === "entregado") {
                entregados++;
            }

        });


        document.getElementById("totalPendientes").textContent = pendientes;

        document.getElementById("totalCamino").textContent = camino;

        document.getElementById("totalEntregados").textContent = entregados;

    }


    dibujarRuta();

});
