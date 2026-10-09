import { Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SubirAlInicio from './components/SubirAlInicio'
import CarritoPanel from './components/CarritoPanel'

import Inicio from './paginas/Inicio'
import Productos from './paginas/Productos'
import DetalleProducto from './paginas/DetalleProducto'
import Nosotros from './paginas/Nosotros'
import Blogs from './paginas/Blogs'
import DetalleBlog1 from './paginas/DetalleBlog1'
import DetalleBlog2 from './paginas/DetalleBlog2'
import DetalleBlog3 from './paginas/DetalleBlog3'
import Contacto from './paginas/Contacto'
import Login from './paginas/Login'
import Registro from './paginas/Registro'
import Perfil from './paginas/Perfil'
import Checkout from './paginas/Checkout'
import CompraExitosa from './paginas/CompraExitosa'
import PagoRechazado from './paginas/PagoRechazado'
import Categorias from './paginas/Categorias'
import AdminDashboard from './paginas/AdminDashboard'
import AdminProductos from './paginas/AdminProductos'
import AdminUsuarios from './paginas/AdminUsuarios'
import AdminOrdenes from './paginas/AdminOrdenes'
function App() {
  return (
    <>
      <SubirAlInicio />
      <Navbar />

      {/* El mapa de direcciones: que componente se muestra en cada ruta */}
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/producto/:codigo" element={<DetalleProducto />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/1" element={<DetalleBlog1 />} />
        <Route path="/blogs/2" element={<DetalleBlog2 />} />
        <Route path="/blogs/3" element={<DetalleBlog3 />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/checkout" element={<Checkout />} />
          <Route path="/compra-exitosa" element={<CompraExitosa />} />
          <Route path="/pago-rechazado" element={<PagoRechazado />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/categorias/:nombre" element={<Categorias />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/ordenes" element={<AdminOrdenes />} />
          <Route path="/admin/productos" element={<AdminProductos />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />

      </Routes>

      <Footer />
      <CarritoPanel />
    </>
  )
}

export default App
