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


                <option
                    value="cancelado"
                    ${
                        pedido.estado ===
                        "cancelado"
                            ? "selected"
                            : ""
                    }
                >
                    Cancelado
                </option>

            </select>

        </div>

    `;

}


// ==========================================
// TEXTO DEL ESTADO
// ==========================================

function obtenerTextoEstado(estado) {

    return textoDeEstado(estado);

}


// ==========================================
// CLASE DEL ESTADO
// ==========================================

function obtenerClaseEstado(estado) {

    return claseDeEstado(estado);

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

// ==========================================
// CREAR ORDEN POR TELEFONO
// ==========================================

const formOrden = document.getElementById("formOrden");

if (formOrden) {

    const ventanaOrden = new bootstrap.Modal(
        document.getElementById("modalOrden")
    );

    const campoCliente = document.getElementById("ordenCliente");
    const campoDireccion = document.getElementById("ordenDireccion");
    const campoComuna = document.getElementById("ordenComuna");
    const campoProducto = document.getElementById("ordenProducto");
    const campoTipoPrecio = document.getElementById("ordenTipoPrecio");
    const campoCantidad = document.getElementById("ordenCantidad");
    const campoRepartidor = document.getElementById("ordenRepartidor");

    const casillaTotal = document.getElementById("ordenTotal");
    const ayudaStock = document.getElementById("ayudaStock");
    const avisoComunaOrden = document.getElementById("avisoOrdenComuna");


    // ======================================
    // LLENAR LOS DESPLEGABLES
    // ======================================

    function catalogoDisponible() {

        if (typeof obtenerCatalogoActivo !== "function") {
            return [];
        }

        return obtenerCatalogoActivo().filter(function (producto) {
            return Number(producto.stock) > 0;
        });

    }


    function llenarProductos() {

        campoProducto.innerHTML = catalogoDisponible().map(function (producto) {

            return '<option value="' + producto.codigo + '">' +
                producto.nombre + " — " + producto.categoria +
                "</option>";

        }).join("");

    }


    function llenarRepartidores() {

        const opciones = obtenerRepartidores().map(function (usuario) {

            return '<option value="' + usuario.correo + '">' +
                usuario.nombre +
                "</option>";

        }).join("");

        campoRepartidor.innerHTML =
            '<option value="">Sin asignar</option>' + opciones;

    }


    function productoElegido() {

        return catalogoDisponible().find(function (producto) {
            return producto.codigo === campoProducto.value;
        });

    }


    function precioElegido(producto) {

        if (!producto) {
            return 0;
        }

        return campoTipoPrecio.value === "comercial"
            ? Number(producto.precioComercial)
            : Number(producto.precioResidencial);

    }


    // ======================================
    // TOTAL EN VIVO
    // ======================================

    function actualizarTotal() {

        const producto = productoElegido();
        const cantidad = Number(campoCantidad.value) || 0;

        casillaTotal.textContent =
            formatearPesos(precioElegido(producto) * cantidad);


        if (producto) {

            ayudaStock.textContent =
                "Quedan " + producto.stock + " unidades. " +
                "Precio unitario: " + formatearPesos(precioElegido(producto)) + ".";

        } else {
            ayudaStock.textContent = "";
        }

    }


    function revisarComunaOrden() {

        const valor = campoComuna.value.trim();

        if (valor === "" || typeof buscarZona !== "function") {
            avisoComunaOrden.textContent = "";
            avisoComunaOrden.className = "mensaje-ayuda";
            return;
        }


        const zona = buscarZona(valor);

        if (zona) {

            avisoComunaOrden.textContent =
                "Dentro de cobertura: " + zona.zona + ".";

            avisoComunaOrden.className = "mensaje-ayuda aviso-cobertura-ok";

        } else {

            avisoComunaOrden.textContent =
                "Esa comuna está fuera del reparto.";

            avisoComunaOrden.className = "mensaje-ayuda aviso-cobertura-no";

        }

    }


    // ======================================
    // VALIDACIONES
    // ======================================

    function pintarOrden(campo, contenedor, mensaje) {

        contenedor.textContent = mensaje;

        campo.classList.toggle("campo-invalido", mensaje !== "");
        campo.classList.toggle("campo-valido", mensaje === "" && campo.value.trim() !== "");

    }


    function validarCantidadOrden() {

        const producto = productoElegido();
        const cantidad = Number(campoCantidad.value);


        if (!campoCantidad.value.trim()) {
            return "Indica la cantidad.";
        }

        if (!Number.isInteger(cantidad) || cantidad < 1) {
            return "La cantidad debe ser un número entero mayor que cero.";
        }

        if (producto && cantidad > Number(producto.stock)) {
            return "Solo quedan " + producto.stock + " unidades de ese producto.";
        }

        return "";

    }


    // ======================================
    // EVENTOS
    // ======================================

    document.getElementById("btnCrearOrden")
        .addEventListener("click", function () {

            formOrden.reset();
            llenarProductos();
            llenarRepartidores();

            [campoCliente, campoDireccion, campoComuna, campoCantidad].forEach(
                function (campo) {
                    campo.classList.remove("campo-valido", "campo-invalido");
                }
            );

            ["errorOrdenCliente", "errorOrdenDireccion", "errorOrdenComuna",
             "errorOrdenProducto", "errorOrdenCantidad"].forEach(function (id) {
                document.getElementById(id).textContent = "";
            });

            avisoComunaOrden.textContent = "";
            campoCantidad.value = 1;

            actualizarTotal();
            ventanaOrden.show();

        });


    campoProducto.addEventListener("change", actualizarTotal);
    campoTipoPrecio.addEventListener("change", actualizarTotal);

    campoCantidad.addEventListener("input", function () {
        actualizarTotal();
        pintarOrden(campoCantidad,
            document.getElementById("errorOrdenCantidad"),
            validarCantidadOrden());
    });

    campoComuna.addEventListener("input", revisarComunaOrden);


    // ======================================
    // GUARDAR
    // ======================================

    formOrden.addEventListener("submit", function (evento) {

        evento.preventDefault();


        const fallas = {
            ordenCliente: campoCliente.value.trim() === ""
                ? "Ingresa el nombre del cliente." : "",

            ordenDireccion: campoDireccion.value.trim() === ""
                ? "Ingresa la dirección de despacho." : "",

            ordenComuna: campoComuna.value.trim() === ""
                ? "Ingresa la comuna." : "",

            ordenProducto: campoProducto.value === ""
                ? "Elige un producto." : "",

            ordenCantidad: validarCantidadOrden()
        };


        pintarOrden(campoCliente, document.getElementById("errorOrdenCliente"), fallas.ordenCliente);
        pintarOrden(campoDireccion, document.getElementById("errorOrdenDireccion"), fallas.ordenDireccion);
        pintarOrden(campoComuna, document.getElementById("errorOrdenComuna"), fallas.ordenComuna);
        pintarOrden(campoProducto, document.getElementById("errorOrdenProducto"), fallas.ordenProducto);
        pintarOrden(campoCantidad, document.getElementById("errorOrdenCantidad"), fallas.ordenCantidad);


        const campos = {
            ordenCliente: campoCliente,
            ordenDireccion: campoDireccion,
            ordenComuna: campoComuna,
            ordenProducto: campoProducto,
            ordenCantidad: campoCantidad
        };


        const primerError = Object.keys(fallas).find(function (clave) {
            return fallas[clave] !== "";
        });


        if (primerError) {
            campos[primerError].focus();
            return;
        }


        const producto = productoElegido();
        const cantidad = Number(campoCantidad.value);


        guardarPedidoManual({
            numero: siguienteNumeroPedido(),
            cliente: campoCliente.value.trim(),
            correo: "",
            direccion: campoDireccion.value.trim(),
            comuna: campoComuna.value.trim(),
            producto: producto.nombre,
            cantidad: cantidad,
            total: precioElegido(producto) * cantidad,
            estado: "pendiente",
            repartidor: campoRepartidor.value
        });


        ventanaOrden.hide();

        mostrarPedidosDespacho();

    });

}
