import { Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Inicio from './paginas/Inicio'
import Productos from './paginas/Productos'
import Nosotros from './paginas/Nosotros'
import Blogs from './paginas/Blogs'
import Contacto from './paginas/Contacto'

function App() {
  return (
    <>
      <Navbar />

      {/* El mapa de direcciones: que componente se muestra en cada ruta */}
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/contacto" element={<Contacto />} />
      </Routes>

      <Footer />
    </>
  )
}

export default App
