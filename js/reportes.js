

function obtenerUsuariosReporte() {

    const usuariosGuardados =
        localStorage.getItem("usuariosSistema");

    if (usuariosGuardados) {
        return JSON.parse(usuariosGuardados);
    }

    return USUARIOS.map(function (usuario, indice) {

        return {
            id: indice + 1,
            nombre: usuario.nombre,
            correo: usuario.correo,
            contrasena: usuario.contrasena,
            rol: usuario.rol,
            activo: true
        };

    });

}


// ==========================================
// PEDIDOS
// ==========================================

function obtenerEstadosPedidos() {

    return obtenerPedidosSistema().map(function (pedido) {

        return pedido.estado;

    });

}


// ==========================================
// GENERAR REPORTE
// ==========================================

function cargarReportes() {

    const usuarios = obtenerUsuariosReporte();
    const pedidos = obtenerEstadosPedidos();


    // ======================================
    // USUARIOS
    // ======================================

    const usuariosActivos =
        usuarios.filter(function (usuario) {

            return usuario.activo !== false;

        }).length;


    const administradores =
        usuarios.filter(function (usuario) {

            return usuario.rol === "ADMINISTRADOR";

        }).length;


    const repartidores =
        usuarios.filter(function (usuario) {

            return usuario.rol === "REPARTIDOR";

        }).length;


    const clientes =
        usuarios.filter(function (usuario) {

            return usuario.rol === "CLIENTE";

        }).length;


    const despachadoras =
        usuarios.filter(function (usuario) {

            return usuario.rol === "DESPACHADORA";

        }).length;


    // ======================================
    // PEDIDOS
    // ======================================

    const pendientes =
        pedidos.filter(function (estado) {

            return estado === "pendiente";

        }).length;


    const enCamino =
        pedidos.filter(function (estado) {

            return estado === "camino";

        }).length;


    const entregados =
        pedidos.filter(function (estado) {

            return estado === "entregado";

        }).length;


    // ======================================
    // MOSTRAR DATOS
    // ======================================

    document.getElementById("totalUsuarios").textContent =
        usuarios.length;

    document.getElementById("usuariosActivos").textContent =
        usuariosActivos;

    document.getElementById("cantidadAdministradores").textContent =
        administradores;

    document.getElementById("cantidadRepartidores").textContent =
        repartidores;

    document.getElementById("cantidadClientes").textContent =
        clientes;

    const casillaDespachadoras =
        document.getElementById("cantidadDespachadoras");

    if (casillaDespachadoras) {
        casillaDespachadoras.textContent = despachadoras;
    }


    document.getElementById("totalPedidos").textContent =
        pedidos.length;

    document.getElementById("pedidosEntregados").textContent =
        entregados;

    document.getElementById("pedidosPendientes").textContent =
        pendientes;

    document.getElementById("pedidosEnCamino").textContent =
        enCamino;

    document.getElementById("pedidosEntregadosTabla").textContent =
        entregados;
}


// ==========================================
// INICIAR
// ==========================================

cargarReportes();

// ==========================================
// DESCARGAR EL REPORTE EN CSV
// ==========================================

function textoDeCelda(valor) {
    const texto = String(valor === undefined || valor === null ? "" : valor);

    if (texto.indexOf(";") !== -1 || texto.indexOf("\n") !== -1 || texto.indexOf('"') !== -1) {
        return '"' + texto.replace(/"/g, '""') + '"';
    }

    return texto;
}


function filaCsv(celdas) {
    return celdas.map(textoDeCelda).join(";");
}


function fechaDeHoy() {
    const hoy = new Date();

    return hoy.toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }) + " a las " + hoy.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


function nombreDelArchivo() {
    const hoy = new Date();

    const dos = function (numero) {
        return String(numero).padStart(2, "0");
    };

    return "reporte-gas-el-volcan-" +
        hoy.getFullYear() + "-" +
        dos(hoy.getMonth() + 1) + "-" +
        dos(hoy.getDate()) + ".csv";
}


function armarReporte() {
    const usuarios = obtenerUsuariosReporte();
    const pedidos = obtenerPedidosSistema();

    const porRol = function (rol) {
        return usuarios.filter(function (usuario) {
            return usuario.rol === rol;
        }).length;
    };

    const porEstado = function (estado) {
        return pedidos.filter(function (pedido) {
            return pedido.estado === estado;
        }).length;
    };

    const lineas = [];

    lineas.push(filaCsv(["REPORTE GAS EL VOLCAN"]));
    lineas.push(filaCsv(["Generado el " + fechaDeHoy()]));
    lineas.push("");

    lineas.push(filaCsv(["RESUMEN"]));
    lineas.push(filaCsv(["Concepto", "Cantidad"]));
    lineas.push(filaCsv(["Usuarios totales", usuarios.length]));

    lineas.push(filaCsv(["Usuarios activos", usuarios.filter(function (usuario) {
        return usuario.activo !== false;
    }).length]));

    lineas.push(filaCsv(["Administradores", porRol("ADMINISTRADOR")]));
    lineas.push(filaCsv(["Despachadoras", porRol("DESPACHADORA")]));
    lineas.push(filaCsv(["Repartidores", porRol("REPARTIDOR")]));
    lineas.push(filaCsv(["Clientes", porRol("CLIENTE")]));
    lineas.push("");

    lineas.push(filaCsv(["Pedidos totales", pedidos.length]));
    lineas.push(filaCsv(["Pendientes", porEstado("pendiente")]));
    lineas.push(filaCsv(["En camino", porEstado("camino")]));
    lineas.push(filaCsv(["Entregados", porEstado("entregado")]));
    lineas.push("");

    lineas.push(filaCsv(["DETALLE DE PEDIDOS"]));

    lineas.push(filaCsv([
        "N Pedido", "Cliente", "Direccion", "Comuna",
        "Producto", "Cantidad", "Total", "Estado", "Repartidor"
    ]));

    pedidos.forEach(function (pedido) {
        lineas.push(filaCsv([
            pedido.numero,
            pedido.cliente,
            pedido.direccion,
            pedido.comuna,
            pedido.producto,
            pedido.cantidad,
            pedido.total,
            textoDeEstado(pedido.estado),
            nombreDeRepartidor(pedido.repartidor)
        ]));
    });

    return lineas.join("\n");
}


function descargarReporte() {
    const contenido = "﻿" + armarReporte();

    const archivo = new Blob([contenido], {
        type: "text/csv;charset=utf-8;"
    });

    const direccion = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = direccion;
    enlace.download = nombreDelArchivo();

    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    URL.revokeObjectURL(direccion);

    const aviso = document.getElementById("avisoDescarga");

    if (aviso) {
        aviso.textContent = "Se descargó " + nombreDelArchivo();
        aviso.classList.remove("d-none");
    }
}


const botonDescargar = document.getElementById("btnDescargarReporte");

if (botonDescargar) {
    botonDescargar.addEventListener("click", descargarReporte);
}
