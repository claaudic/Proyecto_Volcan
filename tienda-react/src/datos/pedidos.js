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

export function buscarPedido(numero) {
    return (
        leerPedidos().find(
            (pedido) => String(pedido.numero) === String(numero)
        ) || null
    )
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

export function actualizarPedido(numero, cambios) {
    let actualizado = null

    const pedidos = leerPedidos().map((pedido) => {
        if (String(pedido.numero) !== String(numero)) {
            return pedido
        }

        actualizado = {
            ...pedido,
            ...cambios,
            numero: pedido.numero
        }

        return actualizado
    })

    guardarPedidos(pedidos)

    return actualizado
}

export function cambiarEstadoPedido(numero, estado) {
    return actualizarPedido(numero, { estado })
}

export function asignarRepartidorPedido(numero, repartidor) {
    return actualizarPedido(numero, {
        repartidor: String(repartidor || '').trim()
    })
}

export function eliminarPedido(numero) {
    const pedidos = leerPedidos()

    const restantes = pedidos.filter(
        (pedido) => String(pedido.numero) !== String(numero)
    )

    guardarPedidos(restantes)

    return restantes.length !== pedidos.length
}
