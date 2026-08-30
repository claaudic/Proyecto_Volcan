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
        const primera = pedido.lineas && pedido.lineas.length > 0
            ? pedido.lineas[0]
            : null;

        const otras = pedido.lineas ? pedido.lineas.length - 1 : 0;

        let producto = "Pedido del sitio";

        if (primera) {
            producto = primera.nombre;

            if (otras > 0) {
                producto = producto + " y " + otras + " producto" + (otras > 1 ? "s" : "") + " más";
            }
        }

        const datos = datosDelCliente(pedido.correo);

        return {
            numero: String(pedido.numero),
            cliente: datos.nombre,
            correo: pedido.correo,
            direccion: datos.direccion,
            comuna: datos.comuna,
            producto: producto,
            cantidad: primera ? primera.cantidad : 1,
            total: pedido.total,
            estado: "pendiente",
            repartidor: ""
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
    const base = PEDIDOS_INICIALES.concat(pedidosDelCarrito());

    return base.map(function (pedido) {
        return {
            numero: pedido.numero,
            cliente: pedido.cliente,
            correo: pedido.correo,
            direccion: pedido.direccion,
            comuna: pedido.comuna,
            producto: pedido.producto,
            cantidad: pedido.cantidad,
            total: pedido.total,
            estado: estadoGuardado(pedido.numero, pedido.estado),
            repartidor: repartidorGuardado(pedido.numero, pedido.repartidor)
        };
    }).sort(function (a, b) {
        return Number(b.numero) - Number(a.numero);
    });
}


function pedidosDelRepartidor(correo) {
    return obtenerPedidosSistema().filter(function (pedido) {
        return String(pedido.repartidor).toLowerCase() === String(correo).toLowerCase();
    });
}


function textoDeEstado(estado) {
    if (estado === "camino") {
        return "En camino";
    }

    if (estado === "entregado") {
        return "Entregado";
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
