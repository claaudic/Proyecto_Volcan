import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import './css/estilos.css'
import './css/efectos.css'
import './index.css'
import App from './App.jsx'
import ProveedorCarrito from './contexto/ProveedorCarrito'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorCarrito>
        <App />
      </ProveedorCarrito>
    </BrowserRouter>
  </StrictMode>,
)
