const CLAVE_PEDIDOS = 'pedidos_volcan'

export function leerPedidos() {
    const datos = localStorage.getItem(CLAVE_PEDIDOS)

    if (!datos) {
        return []
    }

    try {
        return JSON.parse(datos)
    } catch {
        return []
    }
}

export function guardarPedidos(pedidos) {
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos))
}

export function obtenerSiguienteNumeroPedido() {
    const pedidos = leerPedidos()

    if (pedidos.length === 0) {
        return 1
    }

    const numeros = pedidos.map((pedido) => pedido.numero)

    return Math.max(...numeros) + 1
}

export function crearPedido(datosPedido) {
    const pedidos = leerPedidos()

    const nuevoPedido = {
        numero: obtenerSiguienteNumeroPedido(),
        fecha: new Date().toISOString(),
        estado: 'Pendiente',
        ...datosPedido
    }

    const pedidosActualizados = [...pedidos, nuevoPedido]

    guardarPedidos(pedidosActualizados)

    return nuevoPedido
}