import Navbar from './components/Navbar'
import Footer from './components/Footer'
import TarjetaProducto from './components/TarjetaProducto'
import { PRODUCTOS, formatearPrecio, imagenDe } from './datos/productos'
import { useState } from 'react'


function App() {
  const [busqueda, setBusqueda] = useState("")

  const filtrados = PRODUCTOS.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <>
      <Navbar />

      <main className="container py-5">
        <h1>Productos</h1>
        <input
          className="form-control mb-4"
          placeholder="Buscar producto"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

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

      <Footer />
    </>
  )
}

export default App
