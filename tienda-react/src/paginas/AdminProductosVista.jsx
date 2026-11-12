import { formatearPrecio } from '../datos/productos'

function AdminProductosVista({ productos, totalProductos, productosActivos, productosStockCritico, formulario, codigoEditando, mostrarFormulario, productoABorrar, errores, cambiarCampo, abrirNuevoProducto, abrirEditarProducto, cerrarFormulario, guardarProducto, confirmarEliminar, cambiarEstado, setProductoABorrar, categorias, enviando = false, accionesBloqueadas = false, cargando = false, error = '', mensaje = '', conflicto = false, recargar, revisionActual, aceptarRevision }) {
    const avisos = <>
        {cargando && <p role="status">Cargando catálogo administrativo…</p>}
        {enviando && <p role="status">Operación administrativa en curso…</p>}
        {mensaje && <p role="status">{mensaje}</p>}
        {error && <p role="alert" className="text-danger">{error}</p>}
        {recargar && (error || conflicto) && <button type="button" className="btn btn-secundario" disabled={enviando || cargando} onClick={recargar}>
            {conflicto ? 'Recargar para revisar' : 'Actualizar catálogo'}
        </button>}
        {revisionActual && <div role="status">
            <p>Versión actual: {revisionActual.version}. Stock actual: {revisionActual.stock}. Revisa los datos antes de continuar.</p>
            <button type="button" className="btn btn-secundario" disabled={enviando || cargando} onClick={aceptarRevision}>
                Reemplazar borrador con versión actual
            </button>
        </div>}
    </>
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
                            disabled={accionesBloqueadas}
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

                    {!mostrarFormulario && !productoABorrar && avisos}
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
                                                    disabled={accionesBloqueadas}
                                                    onClick={() =>
                                                        abrirEditarProducto(producto)
                                                    }
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-principal me-1 mb-1"
                                                    disabled={accionesBloqueadas}
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
                                                    disabled={accionesBloqueadas}
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
                                {avisos}
                                <fieldset disabled={enviando} style={{ display: 'contents' }}>
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
                                        maxLength="255"
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

                                            {categorias ? categorias.map(categoria => (
                                                <option key={categoria.id} value={String(categoria.id)}>{categoria.nombre}</option>
                                            )) : <>
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
                                            </>}
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
                                        disabled={accionesBloqueadas}
                                    >
                                        {codigoEditando
                                            ? 'Guardar cambios'
                                            : 'Agregar producto'}
                                    </button>
                                </div>

                                </fieldset>
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
                                            {avisos}
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
                                                disabled={accionesBloqueadas}
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

export default AdminProductosVista
