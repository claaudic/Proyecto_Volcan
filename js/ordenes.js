// ==========================================
// ÓRDENES DEL ADMINISTRADOR
// ==========================================

const tablaOrdenes = document.getElementById("tablaOrdenes");

const totalPendientes = document.getElementById("totalPendientes");
const totalCamino = document.getElementById("totalCamino");
const totalEntregados = document.getElementById("totalEntregados");


// ==========================================
// ZONAS DE COBERTURA
// ==========================================

const ZONAS_COBERTURA_ORDENES = [

    {
        zona: "Zona Centro",
        comunas: ["chillan"],
        etiqueta: "Chillán",
        dias: "Lunes a sábado",
        horario: "08:00 – 20:00",
        entrega: "1 – 3 horas"
    },

    {
        zona: "Zona Oriente",
        comunas: ["chillan viejo"],
        etiqueta: "Chillán Viejo",
        dias: "Lunes a viernes",
        horario: "08:00 – 18:00",
        entrega: "2 – 4 horas"
    },

    {
        zona: "Zona Rural",
        comunas: [
            "el carmen",
            "carmen",
            "pinto",
            "san ignacio"
        ],
        etiqueta: "El Carmen, Pinto y San Ignacio",
        dias: "Martes y jueves",
        horario: "08:00 – 16:00",
        entrega: "3 – 6 horas"
    },

    {
        zona: "Zona Sur",
        comunas: [
            "bulnes",
            "quillon"
        ],
        etiqueta: "Bulnes y Quillón",
        dias: "Miércoles",
        horario: "08:00 – 16:00",
        entrega: "4 – 6 horas"
    }

];


// ==========================================
// DATOS DE PEDIDOS
// ==========================================

// Los pedidos vienen de js/pedidos.js


// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalizarComuna(texto) {

    return texto
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


// ==========================================
// BUSCAR ZONA
// ==========================================

function buscarZonaOrden(comuna) {

    const comunaNormalizada =
        normalizarComuna(comuna);


    return ZONAS_COBERTURA_ORDENES.find(function (zona) {

        return zona.comunas.some(function (nombre) {

            return nombre === comunaNormalizada;

        });

    });

}


// ==========================================
// OBTENER PEDIDOS
// ==========================================

function obtenerOrdenes() {

    return obtenerPedidosSistema().map(function (pedido) {

        const zona = buscarZonaOrden(pedido.comuna);


        return {

            numero: pedido.numero,

            cliente: pedido.cliente,

            direccion: pedido.direccion + ", " + pedido.comuna,

            comuna: pedido.comuna,

            zona: zona ? zona.zona : "Fuera de cobertura",

            entrega: zona ? zona.entrega : "No disponible",

            repartidor: nombreDeRepartidor(pedido.repartidor),

            total: pedido.total,

            estado: pedido.estado

        };

    });

}


// ==========================================
// MOSTRAR ÓRDENES
// ==========================================

function mostrarOrdenes() {

    const ordenes = obtenerOrdenes();


    tablaOrdenes.innerHTML = "";


    if (ordenes.length === 0) {

        tablaOrdenes.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="text-center py-4"
                >
                    No hay órdenes registradas.
                </td>

            </tr>

        `;


        actualizarResumen([]);

        return;

    }


    ordenes.forEach(function (orden) {

        const fila =
            document.createElement("tr");


        fila.innerHTML = `

            <td>

                <strong>
                    #${orden.numero}
                </strong>

            </td>


            <td>
                ${orden.cliente}
            </td>


            <td>

                ${orden.direccion}

                <br>

                <small class="text-muted">
                    ${orden.zona}
                    ·
                    ${orden.entrega}
                </small>

            </td>


            <td>
                ${orden.repartidor}
            </td>


            <td>
                ${formatearPrecio(orden.total)}
            </td>


            <td>
                ${crearEstado(orden.estado)}
            </td>


            <td>
                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    data-editar="${orden.numero}"
                >
                    Editar
                </button>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    data-borrar="${orden.numero}"
                >
                    Eliminar
                </button>
            </td>

        `;


        tablaOrdenes.appendChild(fila);

    });


    actualizarResumen(ordenes);

}


// ==========================================
// MOSTRAR ESTADO
// ==========================================

function crearEstado(estado) {

    return '<span class="estado ' + claseDeEstado(estado) + '">' +
        textoDeEstado(estado) +
        "</span>";

}



function actualizarResumen(ordenes) {

    const pendientes =
        ordenes.filter(function (orden) {

            return orden.estado === "pendiente";

        }).length;


    const camino =
        ordenes.filter(function (orden) {

            return orden.estado === "camino";

        }).length;


    const entregados =
        ordenes.filter(function (orden) {

            return orden.estado === "entregado";

        }).length;


    totalPendientes.textContent =
        pendientes;

    totalCamino.textContent =
        camino;

    totalEntregados.textContent =
        entregados;

}



function formatearPrecio(precio) {

    return precio.toLocaleString(

        "es-CL",

        {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }

    );

}


mostrarOrdenes();

// ==========================================
// CREAR, EDITAR Y ELIMINAR ORDENES
// ==========================================

const formOrdenAdmin = document.getElementById("formOrdenAdmin");

if (formOrdenAdmin) {

    const ventanaOrden = new bootstrap.Modal(
        document.getElementById("modalOrdenAdmin")
    );

    const ventanaBorrar = new bootstrap.Modal(
        document.getElementById("modalBorrarOrden")
    );

    const tituloModal = document.getElementById("tituloModalOrdenAdmin");
    const campoNumero = document.getElementById("ordenNumero");

    const campos = {
        cliente: document.getElementById("admCliente"),
        direccion: document.getElementById("admDireccion"),
        comuna: document.getElementById("admComuna"),
        producto: document.getElementById("admProducto"),
        tipoPrecio: document.getElementById("admTipoPrecio"),
        cantidad: document.getElementById("admCantidad"),
        repartidor: document.getElementById("admRepartidor"),
        estado: document.getElementById("admEstado")
    };

    const errores = {
        cliente: document.getElementById("errorAdmCliente"),
        direccion: document.getElementById("errorAdmDireccion"),
        comuna: document.getElementById("errorAdmComuna"),
        producto: document.getElementById("errorAdmProducto"),
        cantidad: document.getElementById("errorAdmCantidad")
    };

    const casillaTotal = document.getElementById("admTotal");
    const ayudaStock = document.getElementById("admAyudaStock");

    let numeroABorrar = "";


    // ======================================
    // TOTAL Y AYUDA EN VIVO
    // ======================================

    function productoElegido() {
        return productosDisponibles().find(function (producto) {
            return producto.codigo === campos.producto.value;
        });
    }


    function precioActual() {
        return precioDeProducto(productoElegido(), campos.tipoPrecio.value);
    }


    function actualizarTotal() {
        const cantidad = Number(campos.cantidad.value) || 0;

        casillaTotal.textContent = formatearPesos(precioActual() * cantidad);

        const producto = productoElegido();

        ayudaStock.textContent = producto
            ? "Quedan " + producto.stock + " unidades. Precio unitario: " +
              formatearPesos(precioActual()) + "."
            : "";
    }


    // ======================================
    // VALIDACION
    // ======================================

    function pintar(campo, contenedor, mensaje) {
        if (contenedor) {
            contenedor.textContent = mensaje;
        }

        campo.classList.toggle("campo-invalido", mensaje !== "");
        campo.classList.toggle("campo-valido", mensaje === "" && campo.value.trim() !== "");
    }


    function validarCantidad() {
        const producto = productoElegido();
        const cantidad = Number(campos.cantidad.value);

        if (!campos.cantidad.value.trim()) {
            return "Indica la cantidad.";
        }

        if (!Number.isInteger(cantidad) || cantidad < 1) {
            return "Debe ser un número entero mayor que cero.";
        }

        if (producto && cantidad > Number(producto.stock)) {
            return "Solo quedan " + producto.stock + " unidades.";
        }

        return "";
    }


    function limpiarMarcas() {
        Object.keys(errores).forEach(function (clave) {
            errores[clave].textContent = "";
        });

        Object.keys(campos).forEach(function (clave) {
            campos[clave].classList.remove("campo-valido", "campo-invalido");
        });
    }


    // ======================================
    // ABRIR EL FORMULARIO
    // ======================================

    function abrirFormulario(orden) {

        limpiarMarcas();

        const esNueva = !orden;

        tituloModal.textContent = esNueva
            ? "Crear orden"
            : "Editar la orden #" + orden.numero;

        campoNumero.value = esNueva ? "" : orden.numero;

        campos.cliente.value = esNueva ? "" : orden.cliente;
        campos.direccion.value = esNueva ? "" : orden.direccionSola;
        campos.comuna.value = esNueva ? "" : orden.comuna;
        campos.cantidad.value = esNueva ? 1 : orden.cantidad;
        campos.tipoPrecio.value = "residencial";

        campos.producto.innerHTML = opcionesDeProducto(esNueva ? "" : orden.codigo);
        campos.repartidor.innerHTML = opcionesDeRepartidor(esNueva ? "" : orden.correoRepartidor);
        campos.estado.innerHTML = opcionesDeEstado(esNueva ? "pendiente" : orden.estado);

        actualizarTotal();
        ventanaOrden.show();
    }


    // ======================================
    // EVENTOS DEL FORMULARIO
    // ======================================

    campos.producto.addEventListener("change", actualizarTotal);
    campos.tipoPrecio.addEventListener("change", actualizarTotal);

    campos.cantidad.addEventListener("input", function () {
        actualizarTotal();
        pintar(campos.cantidad, errores.cantidad, validarCantidad());
    });


    document.getElementById("btnNuevaOrden")
        .addEventListener("click", function () {
            abrirFormulario(null);
        });


    formOrdenAdmin.addEventListener("submit", function (evento) {

        evento.preventDefault();

        const fallas = {
            cliente: campos.cliente.value.trim() === "" ? "Ingresa el nombre del cliente." : "",
            direccion: campos.direccion.value.trim() === "" ? "Ingresa la dirección." : "",
            comuna: campos.comuna.value.trim() === "" ? "Ingresa la comuna." : "",
            producto: campos.producto.value === "" ? "Elige un producto." : "",
            cantidad: validarCantidad()
        };

        Object.keys(fallas).forEach(function (clave) {
            pintar(campos[clave], errores[clave], fallas[clave]);
        });

        const primerError = Object.keys(fallas).find(function (clave) {
            return fallas[clave] !== "";
        });

        if (primerError) {
            campos[primerError].focus();
            return;
        }


        const producto = productoElegido();
        const cantidad = Number(campos.cantidad.value);

        const datos = {
            cliente: campos.cliente.value.trim(),
            direccion: campos.direccion.value.trim(),
            comuna: campos.comuna.value.trim(),
            producto: producto.nombre,
            cantidad: cantidad,
            total: precioActual() * cantidad
        };


        const numero = campoNumero.value;

        if (numero === "") {

            const nuevo = siguienteNumeroPedido();

            guardarPedidoManual(Object.assign({
                numero: nuevo,
                correo: "",
                estado: "pendiente",
                repartidor: ""
            }, datos));

            cambiarEstadoPedido(nuevo, campos.estado.value);
            asignarRepartidor(nuevo, campos.repartidor.value);

        } else {

            editarPedido(numero, datos);
            cambiarEstadoPedido(numero, campos.estado.value);
            asignarRepartidor(numero, campos.repartidor.value);

        }


        ventanaOrden.hide();
        mostrarOrdenes();
    });


    // ======================================
    // BOTONES DE CADA FILA
    // ======================================

    tablaOrdenes.addEventListener("click", function (evento) {

        const editar = evento.target.closest("[data-editar]");
        const borrar = evento.target.closest("[data-borrar]");


        if (editar) {

            const numero = editar.dataset.editar;

            const pedido = obtenerPedidosSistema().find(function (uno) {
                return String(uno.numero) === numero;
            });

            if (!pedido) {
                return;
            }

            const enCatalogo = productosDisponibles().find(function (producto) {
                return producto.nombre === pedido.producto;
            });

            abrirFormulario({
                numero: pedido.numero,
                cliente: pedido.cliente,
                direccionSola: pedido.direccion,
                comuna: pedido.comuna,
                cantidad: pedido.cantidad,
                estado: pedido.estado,
                correoRepartidor: pedido.repartidor,
                codigo: enCatalogo ? enCatalogo.codigo : ""
            });

        }


        if (borrar) {

            numeroABorrar = borrar.dataset.borrar;

            document.getElementById("ordenABorrar").textContent = "#" + numeroABorrar;

            ventanaBorrar.show();

        }

    });


    document.getElementById("confirmarBorrarOrden")
        .addEventListener("click", function () {

            eliminarPedido(numeroABorrar);

            ventanaBorrar.hide();
            mostrarOrdenes();

        });

}
