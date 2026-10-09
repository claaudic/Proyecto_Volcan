import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSesion } from '../contexto/sesionContexto'
import { useCatalogo } from '../contexto/catalogoContexto'
import { formatearPrecio } from '../datos/productos'

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
    const { usuario } = useSesion()

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

    if (!usuario || usuario.rol !== 'ADMINISTRADOR') {
        return <Navigate to="/login" replace />
    }

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

        if (descripcion.length > 500) {
            nuevosErrores.descripcion =
                'La descripción no puede superar los 500 caracteres.'
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

    return (
        <main id="contenidoAdmin">

            <section
                className="pagina-encabezado"
                aria-labelledby="titulo-pagina"
            >
                <div className="encabezado-fondo" aria-hidden="true">
                    <span className="luz luz-encabezado-verde"></span>
                    <span className="luz luz-encabezado-celeste"></span>
                    <span className="encabezado-arco"></span>
                </div>

                <div className="container">
                    <p className="panel-etiqueta">Administración</p>

                    <h1 id="titulo-pagina">
                        Gestión de productos
                    </h1>

                    <p className="pagina-bajada">
                        Administra el catálogo e inventario de Gas El Volcán.
                    </p>

                    <p className="encabezado-accion">
                        <button
                            type="button"
                            className="btn btn-principal"
                            onClick={abrirNuevoProducto}
                        >
                            + Crear producto
                        </button>
                    </p>
                </div>

                <svg
                    className="encabezado-monte"
                    viewBox="0 0 1440 60"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
                </svg>
            </section>

            <div className="panel-cuerpo">
                <div className="container">

                    <section className="panel-aviso">
                        <h2>Inventario</h2>

                        <p>
                            Puedes crear, editar, controlar el stock
                            y desactivar productos.
                        </p>
                    </section>

                    <section className="row g-4 mt-1">

                        <div className="col-12 col-md-4">
                            <article className="tarjeta-dato">
                                <div>
                                    <p className="tarjeta-dato-texto">
                                        Productos
                                    </p>

                                    <p className="tarjeta-dato-numero">
                                        {totalProductos}
                                    </p>
                                </div>
                            </article>
                        </div>

                        <div className="col-12 col-md-4">
                            <article className="tarjeta-dato">
                                <div>
                                    <p className="tarjeta-dato-texto">
                                        Productos activos
                                    </p>

                                    <p className="tarjeta-dato-numero">
                                        {productosActivos}
                                    </p>
                                </div>
                            </article>
                        </div>

                        <div className="col-12 col-md-4">
                            <article className="tarjeta-dato">
                                <div>
                                    <p className="tarjeta-dato-texto">
                                        Stock crítico
                                    </p>

                                    <p className="tarjeta-dato-numero">
                                        {productosStockCritico}
                                    </p>
                                </div>
                            </article>
                        </div>

                    </section>

                    <section className="mt-5">

                        <div className="panel-titulo">
                            <div>
                                <p className="panel-etiqueta">
                                    Inventario
                                </p>

                                <h2>
                                    Lista de productos
                                </h2>
                            </div>
                        </div>

                        <div className="tabla-marco table-responsive">
                            <table className="tabla-panel">

                                <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Producto</th>
                                    <th>Categoría</th>
                                    <th>Unidad</th>
                                    <th>Precio residencial</th>
                                    <th>Precio comercial</th>
                                    <th>Stock</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                                </thead>

                                <tbody>
                                {productos.map((producto) => {
                                    const stockCritico =
                                        producto.stockCritico !== null &&
                                        producto.stockCritico !== '' &&
                                        Number(producto.stock) <=
                                        Number(producto.stockCritico)

                                    return (
                                        <tr key={producto.codigo}>

                                            <td>
                                                <strong>{producto.codigo}</strong>
                                            </td>

                                            <td>
                                                <strong>{producto.nombre}</strong>

                                                <small className="d-block text-muted">
                                                    {producto.descripcion}
                                                </small>
                                            </td>

                                            <td>{producto.categoria}</td>
                                            <td>{producto.unidad}</td>

                                            <td>
                                                {formatearPrecio(
                                                    producto.precioResidencial
                                                )}
                                            </td>

                                            <td>
                                                {formatearPrecio(
                                                    producto.precioComercial
                                                )}
                                            </td>

                                            <td>
                                                {stockCritico ? (
                                                    <>
                              <span className="badge bg-danger">
                                {producto.stock}
                              </span>

                                                        <small className="d-block text-danger mt-1">
                                                            Stock crítico
                                                        </small>
                                                    </>
                                                ) : (
                                                    producto.stock
                                                )}
                                            </td>

                                            <td>
                          <span
                              className={
                                  producto.activo
                                      ? 'badge bg-success'
                                      : 'badge bg-secondary'
                              }
                          >
                            {producto.activo
                                ? 'Activo'
                                : 'Inactivo'}
                          </span>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-secundario me-1 mb-1"
                                                    onClick={() =>
                                                        abrirEditarProducto(producto)
                                                    }
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-principal me-1 mb-1"
                                                    onClick={() =>
                                                        cambiarEstado(producto.codigo)
                                                    }
                                                >
                                                    {producto.activo
                                                        ? 'Desactivar'
                                                        : 'Activar'}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-peligro mb-1"
                                                    onClick={() =>
                                                        setProductoABorrar(producto)
                                                    }
                                                >
                                                    Eliminar
                                                </button>
                                            </td>

                                        </tr>
                                    )
                                })}
                                </tbody>

                            </table>
                        </div>
                    </section>

                    {mostrarFormulario && (
                        <>
                        <div
                            className="modal show d-block"
                            tabIndex="-1"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="titulo-formulario-producto"
                        >
                            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                        <section className="modal-content panel-seccion admin-producto-modal">
                            <div className="panel-titulo">
                                <div>
                                    <p className="panel-etiqueta">
                                        Producto
                                    </p>

                                    <h2 id="titulo-formulario-producto">
                                        {codigoEditando
                                            ? 'Editar producto'
                                            : 'Crear producto'}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="btn-close"
                                    aria-label="Cerrar"
                                    onClick={cerrarFormulario}
                                ></button>
                            </div>

                            <form
                                className="admin-producto-form"
                                noValidate
                                onSubmit={guardarProducto}
                            >
                                <div className="admin-producto-campos">

                                <div className="mb-3">
                                    <label
                                        htmlFor="codigoProducto"
                                        className="form-label"
                                    >
                                        Código
                                    </label>

                                    <input
                                        id="codigoProducto"
                                        name="codigo"
                                        type="text"
                                        className="form-control"
                                        maxLength="20"
                                        value={formulario.codigo}
                                        onChange={cambiarCampo}
                                    />

                                    {errores.codigo && (
                                        <div className="text-danger mt-1">
                                            {errores.codigo}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="nombreProducto"
                                        className="form-label"
                                    >
                                        Nombre
                                    </label>

                                    <input
                                        id="nombreProducto"
                                        name="nombre"
                                        type="text"
                                        className="form-control"
                                        maxLength="100"
                                        value={formulario.nombre}
                                        onChange={cambiarCampo}
                                    />

                                    {errores.nombre && (
                                        <div className="text-danger mt-1">
                                            {errores.nombre}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="descripcionProducto"
                                        className="form-label"
                                    >
                                        Descripción
                                    </label>

                                    <textarea
                                        id="descripcionProducto"
                                        name="descripcion"
                                        className="form-control"
                                        maxLength="500"
                                        rows="3"
                                        value={formulario.descripcion}
                                        onChange={cambiarCampo}
                                    />

                                    {errores.descripcion && (
                                        <div className="text-danger mt-1">
                                            {errores.descripcion}
                                        </div>
                                    )}
                                </div>

                                <div className="row">

                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="categoriaProducto"
                                            className="form-label"
                                        >
                                            Categoría
                                        </label>

                                        <select
                                            id="categoriaProducto"
                                            name="categoria"
                                            className="form-select"
                                            value={formulario.categoria}
                                            onChange={cambiarCampo}
                                        >
                                            <option value="">
                                                Selecciona una categoría
                                            </option>

                                            <option value="Cilindros de Gas">
                                                Cilindros de Gas
                                            </option>

                                            <option value="Reguladores">
                                                Reguladores
                                            </option>

                                            <option value="Mangueras y Conexiones">
                                                Mangueras y Conexiones
                                            </option>

                                            <option value="Accesorios">
                                                Accesorios
                                            </option>
                                        </select>

                                        {errores.categoria && (
                                            <div className="text-danger mt-1">
                                                {errores.categoria}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="unidadProducto"
                                            className="form-label"
                                        >
                                            Unidad
                                        </label>

                                        <select
                                            id="unidadProducto"
                                            name="unidad"
                                            className="form-select"
                                            value={formulario.unidad}
                                            onChange={cambiarCampo}
                                        >
                                            <option value="">
                                                Selecciona una unidad
                                            </option>

                                            <option value="Unidad">
                                                Unidad
                                            </option>

                                            <option value="Kit">
                                                Kit
                                            </option>
                                        </select>

                                        {errores.unidad && (
                                            <div className="text-danger mt-1">
                                                {errores.unidad}
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="row">

                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="precioResidencialProducto"
                                            className="form-label"
                                        >
                                            Precio residencial
                                        </label>

                                        <input
                                            id="precioResidencialProducto"
                                            name="precioResidencial"
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="form-control"
                                            value={formulario.precioResidencial}
                                            onChange={cambiarCampo}
                                        />

                                        {errores.precioResidencial && (
                                            <div className="text-danger mt-1">
                                                {errores.precioResidencial}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="precioComercialProducto"
                                            className="form-label"
                                        >
                                            Precio comercial
                                        </label>

                                        <input
                                            id="precioComercialProducto"
                                            name="precioComercial"
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="form-control"
                                            value={formulario.precioComercial}
                                            onChange={cambiarCampo}
                                        />

                                        {errores.precioComercial && (
                                            <div className="text-danger mt-1">
                                                {errores.precioComercial}
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="row">

                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="stockProducto"
                                            className="form-label"
                                        >
                                            Stock actual
                                        </label>

                                        <input
                                            id="stockProducto"
                                            name="stock"
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="form-control"
                                            value={formulario.stock}
                                            onChange={cambiarCampo}
                                        />

                                        {errores.stock && (
                                            <div className="text-danger mt-1">
                                                {errores.stock}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-12 col-md-6 mb-3">
                                        <label
                                            htmlFor="stockCriticoProducto"
                                            className="form-label"
                                        >
                                            Stock crítico
                                        </label>

                                        <input
                                            id="stockCriticoProducto"
                                            name="stockCritico"
                                            type="number"
                                            min="0"
                                            step="1"
                                            className="form-control"
                                            value={formulario.stockCritico}
                                            onChange={cambiarCampo}
                                        />

                                        {errores.stockCritico && (
                                            <div className="text-danger mt-1">
                                                {errores.stockCritico}
                                            </div>
                                        )}
                                    </div>

                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="imagenProducto"
                                        className="form-label"
                                    >
                                        Imagen
                                    </label>

                                    <input
                                        id="imagenProducto"
                                        name="imagen"
                                        type="text"
                                        className="form-control"
                                        value={formulario.imagen}
                                        onChange={cambiarCampo}
                                    />
                                </div>

                                </div>

                                <div className="modal-footer admin-producto-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secundario"
                                        onClick={cerrarFormulario}
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        type="submit"
                                        className="btn btn-principal"
                                    >
                                        {codigoEditando
                                            ? 'Guardar cambios'
                                            : 'Agregar producto'}
                                    </button>
                                </div>

                            </form>
                        </section>
                            </div>
                        </div>
                        <div className="modal-backdrop show"></div>
                        </>
                    )}

                    {productoABorrar && (
                        <>
                            <div
                                className="modal fade show"
                                style={{
                                    display: 'block'
                                }}
                                tabIndex="-1"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="titulo-eliminar-producto"
                            >
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h2
                                                id="titulo-eliminar-producto"
                                                className="modal-title fs-5"
                                            >
                                                ¿Eliminar el producto?
                                            </h2>

                                            <button
                                                type="button"
                                                className="btn-close"
                                                aria-label="Cerrar"
                                                onClick={() =>
                                                    setProductoABorrar(null)
                                                }
                                            ></button>
                                        </div>

                                        <div className="modal-body">
                                            <p>
                                                Vas a eliminar{' '}
                                                <strong>
                                                    {productoABorrar.nombre}
                                                </strong>{' '}
                                                del catálogo.
                                            </p>

                                            <p className="mb-0">
                                                Si solo quieres dejar de venderlo
                                                por un tiempo, usa Desactivar.
                                            </p>
                                        </div>

                                        <div className="modal-footer">
                                            <button
                                                type="button"
                                                className="btn btn-secundario"
                                                onClick={() =>
                                                    setProductoABorrar(null)
                                                }
                                            >
                                                Cancelar
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-peligro"
                                                onClick={confirmarEliminar}
                                            >
                                                Sí, eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-backdrop fade show"></div>
                        </>
                    )}

                </div>
            </div>

        </main>
    )
}

export default AdminProductos
