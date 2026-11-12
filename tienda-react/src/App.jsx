import { Routes, Route } from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SubirAlInicio from './components/SubirAlInicio'
import CarritoPanel from './components/CarritoPanel'

import Inicio from './paginas/Inicio'
import Productos from './paginas/Productos'
import DetalleProducto from './paginas/DetalleProducto'
import Ofertas from './paginas/Ofertas'
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
import AdminProductosHttp from './paginas/AdminProductosHttp'
import AdminUsuarios from './paginas/AdminUsuarios'
import AdminOrdenes from './paginas/AdminOrdenes'
import AdminReportes from './paginas/AdminReportes'
import Despachadora from './paginas/Despachadora'
import Repartidor from './paginas/Repartidor'
import NoEncontrada from './paginas/NoEncontrada'
import RutaProtegida from './components/RutaProtegida'

// Quien puede entrar a cada panel (el backend repite estas reglas)
const SOLO_ADMIN = ['ADMINISTRADOR']
const SOLO_DESPACHADORA = ['DESPACHADORA']
const SOLO_REPARTIDOR = ['REPARTIDOR']
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
        <Route path="/ofertas" element={<Ofertas />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/1" element={<DetalleBlog1 />} />
        <Route path="/blogs/2" element={<DetalleBlog2 />} />
        <Route path="/blogs/3" element={<DetalleBlog3 />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/perfil" element={<RutaProtegida><Perfil /></RutaProtegida>} />
        <Route path="/checkout" element={<Checkout />} />
          <Route path="/compra-exitosa" element={<CompraExitosa />} />
          <Route path="/pago-rechazado" element={<PagoRechazado />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/categorias/:nombre" element={<Categorias />} />
          <Route path="/admin" element={<RutaProtegida roles={SOLO_ADMIN}><AdminDashboard /></RutaProtegida>} />
          <Route path="/admin/ordenes" element={<RutaProtegida roles={SOLO_ADMIN}><AdminOrdenes /></RutaProtegida>} />
          <Route path="/admin/reportes" element={<RutaProtegida roles={SOLO_ADMIN}><AdminReportes /></RutaProtegida>} />
          <Route path="/admin/productos" element={<RutaProtegida roles={SOLO_ADMIN}><AdminProductosHttp /></RutaProtegida>} />
          <Route path="/admin/usuarios" element={<RutaProtegida roles={SOLO_ADMIN}><AdminUsuarios /></RutaProtegida>} />
          <Route path="/despacho" element={<RutaProtegida roles={SOLO_DESPACHADORA}><Despachadora /></RutaProtegida>} />
          <Route path="/repartidor" element={<RutaProtegida roles={SOLO_REPARTIDOR}><Repartidor /></RutaProtegida>} />

        {/* Va al final: cualquier direccion que no coincida con las de arriba */}
        <Route path="*" element={<NoEncontrada />} />

      </Routes>

      <Footer />
      <CarritoPanel />
    </>
  )
}

export default App
