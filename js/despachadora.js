// ==========================================
// PANEL OPERADORA / DESPACHADORA
// GAS EL VOLCÁN
// ==========================================


// ==========================================
// PROTEGER LA PÁGINA
// ==========================================

const sesionDespachadora = obtenerSesion();

if (
    !sesionDespachadora ||
    sesionDespachadora.rol !== "DESPACHADORA"
) {

    window.location.replace("login.html");

}


// ==========================================
// ELEMENTOS HTML
// ==========================================

const tablaPedidosDespacho =
    document.getElementById("tablaPedidosDespacho");

const totalPedidos =
    document.getElementById("totalPedidos");

const totalPendientes =
    document.getElementById("totalPendientes");

const totalCamino =
    document.getElementById("totalCamino");

const totalEntregados =
    document.getElementById("totalEntregados");

const fechaPedidos =
    document.getElementById("fechaPedidos");

const sinPedidos =
    document.getElementById("sinPedidos");


// ==========================================
// DATOS DE APOYO DE LOS PEDIDOS
// ==========================================
//
// Los estados reales se leen desde localStorage.
// Estos datos sirven para mostrar cliente,
// dirección y zona.
//

// Los pedidos vienen de js/pedidos.js


// ==========================================
// MOSTRAR FECHA ACTUAL
// ==========================================

function mostrarFechaActual() {

    const hoy = new Date();

    fechaPedidos.textContent =
        hoy.toLocaleDateString(
            "es-CL",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

}

mostrarFechaActual();


// ==========================================
// OBTENER USUARIOS
// ==========================================

function obtenerUsuariosDespacho() {

    const guardados =
        localStorage.getItem("usuariosSistema");


    if (guardados) {

        try {

            return JSON.parse(guardados);

        }

        catch (error) {

            console.error(
                "No se pudieron cargar los usuarios.",
                error
            );

        }

    }


    // Si todavía no existe usuariosSistema,
    // usamos los usuarios originales.

    return USUARIOS.map(
        function (usuario, indice) {

            return {

                id: indice + 1,

                nombre:
                    usuario.nombre,

                correo:
                    usuario.correo,

                contrasena:
                    usuario.contrasena,

                rol:
                    usuario.rol,

                activo: true

            };

        }
    );

}


// ==========================================
// OBTENER REPARTIDORES ACTIVOS
// ==========================================

function obtenerRepartidores() {

    const usuarios =
        obtenerUsuariosDespacho();


    return usuarios.filter(
        function (usuario) {

            return (
                usuario.rol === "REPARTIDOR" &&
                usuario.activo !== false
            );

        }
    );

}


// ==========================================
// OBTENER PEDIDOS
// ==========================================

function obtenerPedidosDespacho() {

    return obtenerPedidosSistema().map(function (pedido) {

        return {

            numero: pedido.numero,

            cliente: pedido.cliente,

            direccion: pedido.direccion,

            zona: pedido.comuna,

            estado: pedido.estado,

            repartidor: pedido.repartidor

        };

    });

}


// ==========================================
// CREAR SELECT DE REPARTIDORES
// ==========================================

function crearSelectorRepartidor(pedido) {

    const repartidores =
        obtenerRepartidores();


    let opciones = `

        <option value="">
            Sin asignar
        </option>

    `;


    repartidores.forEach(
        function (repartidor) {

            const seleccionado =
                repartidor.correo ===
                pedido.repartidor
                    ? "selected"
                    : "";


            opciones += `

                <option
                    value="${repartidor.correo}"
                    ${seleccionado}
                >
                    ${repartidor.nombre}
                </option>

            `;

        }
    );


    return `

        <select
            class="selector-repartidor"
            data-pedido="${pedido.numero}"
        >

            ${opciones}

        </select>

    `;

}


// ==========================================
// CREAR SELECT DE ESTADO
// ==========================================

function crearSelectorEstado(pedido) {

    return `

        <div>

            <span
                class="
                    estado-pedido
                    ${obtenerClaseEstado(
                        pedido.estado
                    )}
                "
            >
                ${obtenerTextoEstado(
                    pedido.estado
                )}
            </span>

            <br>

            <select
                class="selector-estado-despacho"
                data-pedido="${pedido.numero}"
            >

                <option
                    value="pendiente"
                    ${
                        pedido.estado ===
                        "pendiente"
                            ? "selected"
                            : ""
                    }
                >
                    Pendiente
                </option>


                <option
                    value="camino"
                    ${
                        pedido.estado ===
                        "camino"
                            ? "selected"
                            : ""
                    }
                >
                    En camino
                </option>


                <option
                    value="entregado"
                    ${
                        pedido.estado ===
                        "entregado"
                            ? "selected"
                            : ""
                    }
                >
                    Entregado
                </option>

            </select>

        </div>

    `;

}


// ==========================================
// TEXTO DEL ESTADO
// ==========================================

function obtenerTextoEstado(estado) {

    if (estado === "pendiente") {
        return "Pendiente";
    }

    if (estado === "camino") {
        return "En camino";
    }

    if (estado === "entregado") {
        return "Entregado";
    }

    return estado;

}


// ==========================================
// CLASE DEL ESTADO
// ==========================================

function obtenerClaseEstado(estado) {

    if (estado === "pendiente") {
        return "estado-pendiente";
    }

    if (estado === "camino") {
        return "estado-camino";
    }

    if (estado === "entregado") {
        return "estado-entregado";
    }

    return "";

}


// ==========================================
// MOSTRAR PEDIDOS
// ==========================================

function mostrarPedidosDespacho() {

    const pedidos =
        obtenerPedidosDespacho();


    tablaPedidosDespacho.innerHTML =
        "";


    // ======================================
    // NO HAY PEDIDOS
    // ======================================

    if (pedidos.length === 0) {

        sinPedidos.classList.remove(
            "d-none"
        );


        actualizarResumen([]);

        return;

    }


    sinPedidos.classList.add(
        "d-none"
    );


    // ======================================
    // CREAR FILAS
    // ======================================

    pedidos.forEach(
        function (pedido) {

            const fila =
                document.createElement(
                    "tr"
                );


            fila.innerHTML = `

                <td>

                    <strong>
                        #${pedido.numero}
                    </strong>

                </td>


                <td>

                    ${pedido.cliente}

                </td>


                <td>

                    ${pedido.direccion}

                </td>


                <td>

                    <span
                        class="zona-pedido"
                    >
                        ${pedido.zona}
                    </span>

                </td>


                <td>

                    ${crearSelectorRepartidor(
                        pedido
                    )}

                </td>


                <td>

                    ${crearSelectorEstado(
                        pedido
                    )}

                </td>

            `;


            tablaPedidosDespacho.appendChild(
                fila
            );

        }
    );


    agregarEventosRepartidores();

    agregarEventosEstados();

    actualizarResumen(pedidos);

}


// ==========================================
// ASIGNAR REPARTIDOR
// ==========================================

function agregarEventosRepartidores() {

    const selectores =
        document.querySelectorAll(
            ".selector-repartidor"
        );


    selectores.forEach(
        function (selector) {

            selector.addEventListener(
                "change",
                function () {

                    const numeroPedido =
                        selector.dataset.pedido;


                    const correoRepartidor =
                        selector.value;


                    const clave =
                        "repartidorPedido_" +
                        numeroPedido;


                    // Si selecciona Sin asignar,
                    // eliminamos la asignación.

                    if (
                        correoRepartidor === ""
                    ) {

                        localStorage.setItem(
                            clave,
                            ""
                        );

                    }

                    else {

                        localStorage.setItem(
                            clave,
                            correoRepartidor
                        );

                    }

                }
            );

        }
    );

}


// ==========================================
// CAMBIAR ESTADO
// ==========================================

function agregarEventosEstados() {

    const selectores =
        document.querySelectorAll(
            ".selector-estado-despacho"
        );


    selectores.forEach(
        function (selector) {

            selector.addEventListener(
                "change",
                function () {

                    const numeroPedido =
                        selector.dataset.pedido;


                    const nuevoEstado =
                        selector.value;


                    localStorage.setItem(

                        "estadoPedido_" +
                        numeroPedido,

                        nuevoEstado

                    );


                    // Volvemos a dibujar la tabla
                    // para actualizar etiqueta
                    // y contadores.

                    mostrarPedidosDespacho();

                }
            );

        }
    );

}


// ==========================================
// ACTUALIZAR RESUMEN
// ==========================================

function actualizarResumen(pedidos) {

    const pendientes =
        pedidos.filter(
            function (pedido) {

                return (
                    pedido.estado ===
                    "pendiente"
                );

            }
        ).length;


    const camino =
        pedidos.filter(
            function (pedido) {

                return (
                    pedido.estado ===
                    "camino"
                );

            }
        ).length;


    const entregados =
        pedidos.filter(
            function (pedido) {

                return (
                    pedido.estado ===
                    "entregado"
                );

            }
        ).length;


    totalPedidos.textContent =
        pedidos.length;


    totalPendientes.textContent =
        pendientes;


    totalCamino.textContent =
        camino;


    totalEntregados.textContent =
        entregados;

}


// ==========================================
// INICIAR
// ==========================================

mostrarPedidosDespacho();