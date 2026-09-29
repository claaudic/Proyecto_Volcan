import { useState } from 'react'
import TarjetaProducto from '../components/TarjetaProducto'
import { PRODUCTOS, formatearPrecio, imagenDe } from '../datos/productos'

function Productos() {
  const [busqueda, setBusqueda] = useState("")
  const [categoria, setCategoria] = useState("")

  // Las categorias salen de los propios productos, sin repetir
  const categorias = [...new Set(PRODUCTOS.map((p) => p.categoria))]

  const filtrados = PRODUCTOS.filter((producto) => {
    const coincideNombre = producto.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase())

    const coincideCategoria =
      categoria === "" || producto.categoria === categoria

    return coincideNombre && coincideCategoria
  })

  return (
    <main className="container py-5">
      <h1>Productos</h1>

      <input
        className="form-control mb-3"
        placeholder="Buscar producto"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="mb-3">
        <button
          className="btn btn-secundario me-2 mb-2"
          onClick={() => setCategoria("")}
        >
          Todas
        </button>

        {categorias.map((cat) => (
          <button
            key={cat}
            className="btn btn-secundario me-2 mb-2"
            onClick={() => setCategoria(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <p className="text-muted mb-4">
        {filtrados.length} de {PRODUCTOS.length} productos
      </p>

      <ul className="row g-4 list-unstyled">
        {filtrados.map((producto) => (
          <li key={producto.codigo} className="col-12 col-sm-6 col-lg-3">
            <TarjetaProducto
              nombre={producto.nombre}
              categoria={producto.categoria}
              precio={formatearPrecio(producto.precioResidencial)}
              imagen={imagenDe(producto.codigo)}
            />
          </li>
        ))}
      </ul>
    </main>
  )
}

export default Productos
