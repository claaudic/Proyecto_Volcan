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
                    colspan="6"
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

        `;


        tablaOrdenes.appendChild(fila);

    });


    actualizarResumen(ordenes);

}


// ==========================================
// MOSTRAR ESTADO
// ==========================================

function crearEstado(estado) {

    if (estado === "pendiente") {

        return `

            <span
                class="badge bg-warning text-dark"
            >
                Pendiente
            </span>

        `;

    }


    if (estado === "camino") {

        return `

            <span
                class="badge bg-primary"
            >
                En camino
            </span>

        `;

    }


    if (estado === "entregado") {

        return `

            <span
                class="badge bg-success"
            >
                Entregado
            </span>

        `;

    }


    return `

        <span
            class="badge bg-secondary"
        >
            ${estado}
        </span>

    `;

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