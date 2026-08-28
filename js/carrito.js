const CLAVE_CARRITO = "carritoVolcan";

function obtenerCarrito() {
    const guardado = localStorage.getItem(CLAVE_CARRITO);

    if (!guardado) {
        return [];
    }

    try {
        const items = JSON.parse(guardado);
        return Array.isArray(items) ? items : [];
    } catch (error) {
        return [];
    }
}

function guardarCarrito(items) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
    actualizarContadorCarrito();
}

function buscarProductoCatalogo(codigo) {
    if (typeof obtenerCatalogo !== "function") {
        return null;
    }

    return obtenerCatalogo().find(function (producto) {
        return producto.codigo === codigo;
    }) || null;
}

function agregarAlCarrito(codigo, cantidad) {
    const producto = buscarProductoCatalogo(codigo);

    if (!producto || producto.stock === 0) {
        return { ok: false, mensaje: "Este producto no tiene stock disponible." };
    }

    const pedida = Math.max(1, Number(cantidad) || 1);
    const items = obtenerCarrito();
    const existente = items.find(function (item) {
        return item.codigo === codigo;
    });

    const yaEnCarrito = existente ? existente.cantidad : 0;
    const total = yaEnCarrito + pedida;

    if (total > producto.stock) {
        const disponible = producto.stock - yaEnCarrito;

        if (disponible <= 0) {
            return { ok: false, mensaje: "Ya tienes todo el stock disponible de este producto en el carrito." };
        }

        return { ok: false, mensaje: "Solo quedan " + disponible + " unidades disponibles." };
    }

    if (existente) {
        existente.cantidad = total;
    } else {
        items.push({ codigo: codigo, cantidad: pedida });
    }

    guardarCarrito(items);
    return { ok: true, mensaje: producto.nombre + " agregado al carrito." };
}

function cambiarCantidad(codigo, cantidad) {
    const producto = buscarProductoCatalogo(codigo);
    const nueva = Number(cantidad);

    if (!producto || nueva < 1) {
        return false;
    }

    if (nueva > producto.stock) {
        return false;
    }

    const items = obtenerCarrito();
    const item = items.find(function (elemento) {
        return elemento.codigo === codigo;
    });

    if (!item) {
        return false;
    }

    item.cantidad = nueva;
    guardarCarrito(items);
    return true;
}

function quitarDelCarrito(codigo) {
    const items = obtenerCarrito().filter(function (item) {
        return item.codigo !== codigo;
    });

    guardarCarrito(items);
}

function vaciarCarrito() {
    guardarCarrito([]);
}

function contarUnidades() {
    return obtenerCarrito().reduce(function (suma, item) {
        return suma + item.cantidad;
    }, 0);
}

function detalleCarrito() {
    const lineas = [];
    let total = 0;

    obtenerCarrito().forEach(function (item) {
        const producto = buscarProductoCatalogo(item.codigo);

        if (!producto) {
            return;
        }

        const cantidad = Math.min(item.cantidad, producto.stock);
        const subtotal = producto.precioResidencial * cantidad;
        total = total + subtotal;

        lineas.push({
            codigo: producto.codigo,
            nombre: producto.nombre,
            categoria: producto.categoria,
            descripcion: producto.descripcion,
            precio: producto.precioResidencial,
            stock: producto.stock,
            cantidad: cantidad,
            subtotal: subtotal
        });
    });

    return { lineas: lineas, total: total };
}

function formatearMonto(monto) {
    return Number(monto).toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    });
}

function actualizarContadorCarrito() {
    const unidades = contarUnidades();

    document.querySelectorAll(".carrito-total").forEach(function (elemento) {
        elemento.textContent = String(unidades);
    });
}

document.addEventListener("DOMContentLoaded", actualizarContadorCarrito);
