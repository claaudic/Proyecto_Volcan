import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import './css/estilos.css'
import './css/efectos.css'
import './css/login.css'
import './index.css'
import App from './App.jsx'
import ProveedorCarrito from './contexto/ProveedorCarrito'
import ProveedorSesion from './contexto/ProveedorSesion'
import ProveedorCatalogo from './contexto/ProveedorCatalogo'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorSesion>
        {/* El catalogo va por fuera del carrito, porque el carrito lo usa */}
        <ProveedorCatalogo>
          <ProveedorCarrito>
            <App />
          </ProveedorCarrito>
        </ProveedorCatalogo>
      </ProveedorSesion>
    </BrowserRouter>
  </StrictMode>,
)
