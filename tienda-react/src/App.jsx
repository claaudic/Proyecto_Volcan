import Navbar from './components/Navbar'
import Footer from './components/Footer'
import TarjetaProducto from './components/TarjetaProducto'

function App() {
  return (
    <>
      <Navbar />

      <main className="container py-5">
        <h1>Productos</h1>

        <ul className="row g-4 list-unstyled">
          <li className="col-12 col-sm-6 col-lg-3">
            <TarjetaProducto
              nombre="Cilindro GLP 15 kg"
              categoria="Cilindros de Gas"
              precio="$16.000"
              imagen="/img/cl003.jpg"
            />
          </li>

          <li className="col-12 col-sm-6 col-lg-3">
            <TarjetaProducto
              nombre="Regulador doméstico estándar"
              categoria="Reguladores"
              precio="$8.990"
              imagen="/img/rg001.jpg"
            />
          </li>
        </ul>
      </main>

      <Footer />
    </>
  )
}

export default App
