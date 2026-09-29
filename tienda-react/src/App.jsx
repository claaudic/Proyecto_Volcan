import Navbar from './components/Navbar'
import Footer from './components/Footer'
import TarjetaProducto from './components/TarjetaProducto'
import { PRODUCTOS, formatearPrecio, imagenDe } from './datos/productos'

function App() {
  return (
    <>
      <Navbar />

      <main className="container py-5">
        <h1>Productos</h1>

        <ul className="row g-4 list-unstyled">
          {PRODUCTOS.map((producto) => (
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
