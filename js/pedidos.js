const CLAVE_ESTADO_PEDIDO = "estadoPedido_";
const CLAVE_REPARTIDOR_PEDIDO = "repartidorPedido_";

const PEDIDOS_INICIALES = [
    {
        numero: "1001",
        cliente: "Camila Rojas",
        correo: "cliente@gmail.com",
        direccion: "Av. O'Higgins 850",
        comuna: "Chillán",
        producto: "Cilindro de gas licuado 15 kg",
        cantidad: 1,
        total: 28990,
        estado: "pendiente",
        repartidor: "repartidor@gaselvolcan.cl"
    },
    {
        numero: "1002",
        cliente: "Felipe González",
        correo: "felipe.gonzalez@gmail.com",
        direccion: "Los Puelches 430",
        comuna: "Chillán Viejo",
        producto: "Cilindro de gas licuado 11 kg",
        cantidad: 2,
        total: 43980,
        estado: "pendiente",
        repartidor: "repartidor@gaselvolcan.cl"
    },
    {
        numero: "1003",
        cliente: "María Soto",
        correo: "maria.soto@gmail.com",
        direccion: "Camino a Las Trancas 620",
        comuna: "Pinto",
        producto: "Cilindro de gas licuado 5 kg",
        cantidad: 1,
        total: 12490,
        estado: "camino",
        repartidor: "repartidor2@gaselvolcan.cl"
    },
    {
        numero: "1004",
        cliente: "Jorge Bustos",
        correo: "jorge.bustos@gmail.com",
        direccion: "Arturo Prat 1180",
        comuna: "Chillán",
        producto: "Regulador de gas domiciliario",
        cantidad: 1,
        total: 8990,
        estado: "entregado",
        repartidor: "repartidor@gaselvolcan.cl"
    },
    {
        numero: "1005",
        cliente: "Valentina Muñoz",
        correo: "valentina.munoz@gmail.com",
        direccion: "Las Rosas 321",
        comuna: "Bulnes",
        producto: "Cilindro de gas licuado 45 kg",
        cantidad: 1,
        total: 79990,
        estado: "pendiente",
        repartidor: ""
    },
    {
        numero: "1006",
        cliente: "Camila Rojas",
        correo: "cliente@gmail.com",
        direccion: "Av. O'Higgins 850",
        comuna: "Chillán",
        producto: "Manguera para gas 1,5 m",
        cantidad: 2,
        total: 7980,
        estado: "entregado",
        repartidor: "repartidor2@gaselvolcan.cl"
    }
];


function estadoGuardado(numero, porDefecto) {
    return localStorage.getItem(CLAVE_ESTADO_PEDIDO + numero) || porDefecto;
}


function repartidorGuardado(numero, porDefecto) {
    const guardado = localStorage.getItem(CLAVE_REPARTIDOR_PEDIDO + numero);

    if (guardado === null) {
        return porDefecto;
    }

    return guardado;
}

function pedidosDelCarrito() {

    if (typeof obtenerPedidos !== "function") {
        return [];
    }


    return obtenerPedidos().map(function (pedido) {

        const primera =
            pedido.lineas && pedido.lineas.length > 0
                ? pedido.lineas[0]
                : null;


        const otras =
            pedido.lineas
                ? pedido.lineas.length - 1
                : 0;


        let producto = "Pedido del sitio";


        if (primera) {

            producto = primera.nombre;

            if (otras > 0) {

                producto =
                    producto +
                    " y " +
                    otras +
                    " producto" +
                    (otras > 1 ? "s" : "") +
                    " más";
            }
        }


        // ==========================================
        // COMPRA COMO INVITADO
        // ==========================================

        if (
            pedido.tipoCliente === "INVITADO" &&
            pedido.clienteInvitado
        ) {

            return {

                numero:
                    String(pedido.numero),

                cliente:
                    pedido.clienteInvitado.nombre +
                    " (Invitado)",

                correo:
                    pedido.clienteInvitado.correo || "",

                direccion:
                    pedido.clienteInvitado.direccion ||
                    "Sin dirección registrada",

                comuna:
                    pedido.clienteInvitado.comuna ||
                    "Sin comuna",

                producto:
                    producto,

                cantidad:
                    primera
                        ? primera.cantidad
                        : 1,

                total:
                    pedido.total,

                estado:
                    "pendiente",

                repartidor:
                    "",

                tipoCliente:
                    "INVITADO"
            };

        }


        // ==========================================
        // CLIENTE REGISTRADO
        // ==========================================

        const datos =
            datosDelCliente(
                pedido.correo
            );


        return {

            numero:
                String(pedido.numero),

            cliente:
                datos.nombre,

            correo:
                pedido.correo,

            direccion:
                datos.direccion,

            comuna:
                datos.comuna,

            producto:
                producto,

            cantidad:
                primera
                    ? primera.cantidad
                    : 1,

            total:
                pedido.total,

            estado:
                "pendiente",

            repartidor:
                "",

            tipoCliente:
                "REGISTRADO"
        };

    });
}

function datosDelCliente(correo) {
    const vacio = {
        nombre: "Cliente del sitio",
        direccion: "Sin dirección registrada",
        comuna: "Sin comuna"
    };

    if (!correo) {
        return vacio;
    }

    const guardado = localStorage.getItem("perfil_" + String(correo).toLowerCase());

    let perfil = {};

    if (guardado) {
        try {
            perfil = JSON.parse(guardado) || {};
        } catch (error) {
            perfil = {};
        }
    }

    const cuenta = typeof USUARIOS !== "undefined"
        ? USUARIOS.find(function (usuario) {
            return usuario.correo.toLowerCase() === String(correo).toLowerCase();
        })
        : null;

    let nombre = vacio.nombre;

    if (perfil.nombre) {
        nombre = perfil.nombre + (perfil.apellidos ? " " + perfil.apellidos : "");
    } else if (cuenta) {
        nombre = cuenta.nombre;
    }

    return {
        nombre: nombre,
        direccion: perfil.direccion || vacio.direccion,
        comuna: perfil.comuna || vacio.comuna
    };
}


function obtenerPedidosSistema() {

    const borrados = numerosEliminados();
    const cambios = cambiosDePedidos();

    const base = PEDIDOS_INICIALES
        .concat(pedidosDelCarrito())
        .concat(obtenerPedidosManuales());

    return base.filter(function (pedido) {

        return borrados.indexOf(String(pedido.numero)) === -1;

    }).map(function (pedido) {

        const cambio = cambios[String(pedido.numero)] || {};

        const tomar = function (campo) {
            return cambio[campo] !== undefined ? cambio[campo] : pedido[campo];
        };

        return {
            numero: pedido.numero,
            cliente: tomar("cliente"),
            correo: pedido.correo,
            direccion: tomar("direccion"),
            comuna: tomar("comuna"),
            producto: tomar("producto"),
            cantidad: tomar("cantidad"),
            total: tomar("total"),
            estado: estadoGuardado(pedido.numero, pedido.estado),
            repartidor: repartidorGuardado(pedido.numero, pedido.repartidor)
        };

    }).sort(function (a, b) {
        return Number(b.numero) - Number(a.numero);
    });

}


function pedidosDelRepartidor(correo) {
    return obtenerPedidosSistema().filter(function (pedido) {
        return String(pedido.repartidor).toLowerCase() === String(correo).toLowerCase() &&
            pedido.estado !== "cancelado";
    });
}


function textoDeEstado(estado) {
    if (estado === "camino") {
        return "En camino";
    }

    if (estado === "entregado") {
        return "Entregado";
    }

    if (estado === "cancelado") {
        return "Cancelado";
    }

    return "Pendiente";
}


function claseDeEstado(estado) {
    if (estado === "camino") {
        return "estado-camino";
    }

    if (estado === "entregado") {
        return "estado-entregado";
    }

    if (estado === "cancelado") {
        return "estado-cancelado";
    }

    return "estado-pendiente";
}


function formatearPesos(monto) {
    return Number(monto).toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    });
}

function nombreDeRepartidor(correo) {
    if (!correo) {
        return "Sin asignar";
    }

    const guardados = localStorage.getItem("usuariosSistema");

    if (guardados) {
        try {
            const lista = JSON.parse(guardados);

            if (Array.isArray(lista)) {
                const encontrado = lista.find(function (usuario) {
                    return String(usuario.correo).toLowerCase() === String(correo).toLowerCase();
                });

                if (encontrado) {
                    return encontrado.nombre;
                }
            }
        } catch (error) {
            return correo;
        }
    }

    const cuenta = USUARIOS.find(function (usuario) {
        return usuario.correo.toLowerCase() === String(correo).toLowerCase();
    });

    return cuenta ? cuenta.nombre : correo;
}


const CLAVE_PEDIDOS_MANUALES = "pedidosManuales";


function obtenerPedidosManuales() {
    const guardado = localStorage.getItem(CLAVE_PEDIDOS_MANUALES);

    if (!guardado) {
        return [];
    }

    try {
        const lista = JSON.parse(guardado);
        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        return [];
    }
}


function siguienteNumeroPedido() {
    let mayor = 0;

    obtenerPedidosSistema().forEach(function (pedido) {
        const numero = Number(pedido.numero) || 0;

        if (numero > mayor) {
            mayor = numero;
        }
    });

    return String(mayor + 1);
}


function guardarPedidoManual(pedido) {
    const lista = obtenerPedidosManuales();

    lista.push(pedido);

    localStorage.setItem(CLAVE_PEDIDOS_MANUALES, JSON.stringify(lista));
}


// ==========================================
// CAMBIOS Y BORRADOS SOBRE LOS PEDIDOS
// Los pedidos de la semilla viven en el
// codigo, asi que las modificaciones se
// guardan aparte y se aplican al leerlos.
// ==========================================

const CLAVE_PEDIDOS_EDITADOS = "pedidosEditados";
const CLAVE_PEDIDOS_ELIMINADOS = "pedidosEliminados";


function cambiosDePedidos() {
    const guardado = localStorage.getItem(CLAVE_PEDIDOS_EDITADOS);

    if (!guardado) {
        return {};
    }

    try {
        const mapa = JSON.parse(guardado);
        return mapa && typeof mapa === "object" ? mapa : {};
    } catch (error) {
        return {};
    }
}


function numerosEliminados() {
    const guardado = localStorage.getItem(CLAVE_PEDIDOS_ELIMINADOS);

    if (!guardado) {
        return [];
    }

    try {
        const lista = JSON.parse(guardado);
        return Array.isArray(lista) ? lista.map(String) : [];
    } catch (error) {
        return [];
    }
}


function editarPedido(numero, datos) {
    const cambios = cambiosDePedidos();
    const clave = String(numero);

    cambios[clave] = Object.assign({}, cambios[clave], datos);

    localStorage.setItem(CLAVE_PEDIDOS_EDITADOS, JSON.stringify(cambios));
}


function eliminarPedido(numero) {
    const lista = numerosEliminados();
    const clave = String(numero);

    if (lista.indexOf(clave) === -1) {
        lista.push(clave);
        localStorage.setItem(CLAVE_PEDIDOS_ELIMINADOS, JSON.stringify(lista));
    }
}


function cambiarEstadoPedido(numero, estado) {
    localStorage.setItem(CLAVE_ESTADO_PEDIDO + numero, estado);
}


function asignarRepartidor(numero, correo) {
    localStorage.setItem(CLAVE_REPARTIDOR_PEDIDO + numero, correo);
}


// ==========================================
// PIEZAS QUE COMPARTEN LOS FORMULARIOS
// DE DESPACHO Y ADMINISTRACION
// ==========================================

function productosDisponibles() {
    if (typeof obtenerCatalogoActivo !== "function") {
        return [];
    }

    return obtenerCatalogoActivo().filter(function (producto) {
        return Number(producto.stock) > 0;
    });
}


function precioDeProducto(producto, tipo) {
    if (!producto) {
        return 0;
    }

    return tipo === "comercial"
        ? Number(producto.precioComercial)
        : Number(producto.precioResidencial);
}


function repartidoresActivos() {
    const guardados = localStorage.getItem("usuariosSistema");

    let usuarios = [];

    if (guardados) {
        try {
            const lista = JSON.parse(guardados);

            if (Array.isArray(lista)) {
                usuarios = lista;
            }
        } catch (error) {
            usuarios = [];
        }
    }

    if (usuarios.length === 0) {
        usuarios = USUARIOS;
    }

    return usuarios.filter(function (usuario) {
        return usuario.rol === "REPARTIDOR" && usuario.activo !== false;
    });
}


function opcionesDeProducto(codigoElegido) {
    return productosDisponibles().map(function (producto) {

        const marca = producto.codigo === codigoElegido ? " selected" : "";

        return '<option value="' + producto.codigo + '"' + marca + ">" +
            producto.nombre + " — " + producto.categoria +
            "</option>";

    }).join("");
}


function opcionesDeRepartidor(correoElegido) {
    const sinAsignar = !correoElegido ? " selected" : "";

    return '<option value=""' + sinAsignar + ">Sin asignar</option>" +
        repartidoresActivos().map(function (usuario) {

            const marca = usuario.correo === correoElegido ? " selected" : "";

            return '<option value="' + usuario.correo + '"' + marca + ">" +
                usuario.nombre +
                "</option>";

        }).join("");
}


function opcionesDeEstado(estadoElegido) {
    const estados = ["pendiente", "camino", "entregado", "cancelado"];

    return estados.map(function (estado) {

        const marca = estado === estadoElegido ? " selected" : "";

        return '<option value="' + estado + '"' + marca + ">" +
            textoDeEstado(estado) +
            "</option>";

    }).join("");
}
