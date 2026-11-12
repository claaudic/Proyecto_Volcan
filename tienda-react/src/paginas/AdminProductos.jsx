import { useState } from 'react'
import { useCatalogo } from '../contexto/catalogoContexto'
import AdminProductosVista from './AdminProductosVista'

const FORMULARIO_VACIO = {
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    unidad: '',
    precioResidencial: '',
    precioComercial: '',
    stock: '',
    stockCritico: '',
    imagen: ''
}

function AdminProductos() {

    const {
        productos,
        crear,
        editar,
        cambiarEstado,
        eliminar
    } = useCatalogo()
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
    const [codigoEditando, setCodigoEditando] = useState(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [productoABorrar, setProductoABorrar] = useState(null)
    const [errores, setErrores] = useState({})

    const totalProductos = productos.length

    const productosActivos = productos.filter(
        (producto) => producto.activo === true
    ).length

    const productosStockCritico = productos.filter((producto) => {
        return (
            producto.stockCritico !== null &&
            producto.stockCritico !== '' &&
            Number(producto.stock) <= Number(producto.stockCritico)
        )
    }).length

    function cambiarCampo(evento) {
        const { name, value } = evento.target

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }))
    }

    function abrirNuevoProducto() {
        setFormulario(FORMULARIO_VACIO)
        setCodigoEditando(null)
        setErrores({})
        setMostrarFormulario(true)
    }

    function abrirEditarProducto(producto) {
        setFormulario({
            codigo: producto.codigo,
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            categoria: producto.categoria,
            unidad: producto.unidad,
            precioResidencial: producto.precioResidencial,
            precioComercial: producto.precioComercial,
            stock: producto.stock,
            stockCritico: producto.stockCritico ?? '',
            imagen: producto.imagen || ''
        })

        setCodigoEditando(producto.codigo)
        setErrores({})
        setMostrarFormulario(true)
    }

    function cerrarFormulario() {
        setMostrarFormulario(false)
        setErrores({})
    }

    function validarFormulario() {
        const nuevosErrores = {}

        const codigo = formulario.codigo.trim().toUpperCase()
        const nombre = formulario.nombre.trim()
        const descripcion = formulario.descripcion.trim()

        if (codigo === '') {
            nuevosErrores.codigo = 'Ingresa el código del producto.'
        } else if (codigo.length < 3) {
            nuevosErrores.codigo =
                'El código debe tener al menos 3 caracteres.'
        }

        if (nombre === '') {
            nuevosErrores.nombre = 'Ingresa el nombre del producto.'
        } else if (nombre.length > 100) {
            nuevosErrores.nombre =
                'El nombre no puede superar los 100 caracteres.'
        }

        if (descripcion.length > 255) {
            nuevosErrores.descripcion =
                'La descripción no puede superar los 255 caracteres.'
        }

        if (formulario.categoria === '') {
            nuevosErrores.categoria =
                'Selecciona una categoría.'
        }

        if (formulario.unidad === '') {
            nuevosErrores.unidad =
                'Selecciona una unidad.'
        }

        if (
            formulario.precioResidencial === '' ||
            Number(formulario.precioResidencial) < 0
        ) {
            nuevosErrores.precioResidencial =
                'Ingresa un precio residencial válido.'
        }

        if (
            formulario.precioComercial === '' ||
            Number(formulario.precioComercial) < 0
        ) {
            nuevosErrores.precioComercial =
                'Ingresa un precio comercial válido.'
        }

        if (
            formulario.stock === '' ||
            Number(formulario.stock) < 0 ||
            !Number.isInteger(Number(formulario.stock))
        ) {
            nuevosErrores.stock =
                'El stock debe ser un número entero mayor o igual a 0.'
        }

        if (
            formulario.stockCritico !== '' &&
            (
                Number(formulario.stockCritico) < 0 ||
                !Number.isInteger(Number(formulario.stockCritico))
            )
        ) {
            nuevosErrores.stockCritico =
                'El stock crítico debe ser un número entero mayor o igual a 0.'
        }

        const codigoDuplicado = productos.some((producto) => {
            return (
                producto.codigo.toUpperCase() === codigo &&
                producto.codigo !== codigoEditando
            )
        })

        if (codigoDuplicado) {
            nuevosErrores.codigo =
                'Ya existe un producto con ese código.'
        }

        setErrores(nuevosErrores)

        return Object.keys(nuevosErrores).length === 0
    }

    function guardarProducto(evento) {
        evento.preventDefault()

        if (!validarFormulario()) {
            return
        }

        const datos = {
            codigo: formulario.codigo.trim().toUpperCase(),
            nombre: formulario.nombre.trim(),
            descripcion: formulario.descripcion.trim(),
            categoria: formulario.categoria,
            unidad: formulario.unidad,
            precioResidencial: Number(formulario.precioResidencial),
            precioComercial: Number(formulario.precioComercial),
            stock: Number(formulario.stock),
            stockCritico:
                formulario.stockCritico === ''
                    ? null
                    : Number(formulario.stockCritico),
            imagen: formulario.imagen.trim()
        }

        if (codigoEditando) {
            editar(codigoEditando, datos)
        } else {
            crear(datos)
        }

        setFormulario(FORMULARIO_VACIO)
        setCodigoEditando(null)
        setErrores({})
        setMostrarFormulario(false)
    }

    function confirmarEliminar() {
        if (!productoABorrar) {
            return
        }

        eliminar(productoABorrar.codigo)
        setProductoABorrar(null)
    }

    return <AdminProductosVista {...{ productos, totalProductos, productosActivos, productosStockCritico, formulario, codigoEditando, mostrarFormulario, productoABorrar, errores, cambiarCampo, abrirNuevoProducto, abrirEditarProducto, cerrarFormulario, guardarProducto, confirmarEliminar, cambiarEstado, setProductoABorrar }} />
}

export default AdminProductos
