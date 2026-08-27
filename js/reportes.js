

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

    const estados = [];

    for (let i = 0; i < localStorage.length; i++) {

        const clave = localStorage.key(i);

        if (
            clave &&
            clave.startsWith("estadoPedido_")
        ) {

            estados.push(
                localStorage.getItem(clave)
            );

        }

    }

    return estados;
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