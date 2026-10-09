import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProveedorSesion from '../contexto/ProveedorSesion'
import ProveedorCatalogo from '../contexto/ProveedorCatalogo'
import ProveedorCarrito from '../contexto/ProveedorCarrito'

// Ayuda para las pruebas con Testing Library, como en la guia GameTech.
// Monta una pagina con la sesion, el catalogo, el carrito y el router.
//
//   renderizar(<Contacto />)
//   renderizar(<DetalleProducto />, { ruta: '/producto/CL002', patron: '/producto/:codigo' })
//   renderizar(<AdminUsuarios />, { usuario: ADMIN })
//
// opciones.usuario: parte con esa sesion iniciada
// opciones.carrito: parte con ese carrito, por ejemplo [{ codigo: 'CL001', cantidad: 2 }]
// opciones.pedidos: parte con esos pedidos guardados
// localStorage ya viene limpio desde setup.js

export const ADMIN = { nombre: 'Sofía Pérez', correo: 'admin@gaselvolcan.cl', rol: 'ADMINISTRADOR' }
export const CLIENTE = { nombre: 'Camila Rojas', correo: 'camila@gmail.com', rol: 'CLIENTE' }

export function renderizar(elemento, opciones = {}) {
  const { ruta = '/', patron = '*', usuario, carrito, pedidos } = opciones

  if (usuario) {
    localStorage.setItem('usuarioActivo', JSON.stringify(usuario))
  }
  if (carrito) {
    localStorage.setItem('carritoVolcan', JSON.stringify(carrito))
  }
  if (pedidos) {
    localStorage.setItem('pedidos_volcan', JSON.stringify(pedidos))
  }

  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorSesion>
        <ProveedorCatalogo>
          <ProveedorCarrito>
            <Routes>
              <Route path={patron} element={elemento} />
              {/* Paginas de destino, para saber a donde nos llevo un enlace */}
              <Route path="/login" element={<h1>Página de login</h1>} />
              <Route path="/checkout" element={<h1>Página de checkout</h1>} />
            </Routes>
          </ProveedorCarrito>
        </ProveedorCatalogo>
      </ProveedorSesion>
    </MemoryRouter>
  )
}

// Un pedido de ejemplo con la forma que guarda el checkout
export function pedidoDeEjemplo(cambios = {}) {
  return {
    numero: 1,
    fecha: '2026-10-05T12:00:00.000Z',
    estado: 'Pendiente',
    cliente: { nombre: 'Camila Rojas', correo: 'camila@gmail.com', telefono: '+56 9 1234 5678' },
    entrega: { direccion: 'Libertad 123', comuna: 'Chillán', indicaciones: '' },
    productos: [{ codigo: 'CL001', nombre: 'Cilindro GLP 5 kg', cantidad: 1, precio: 6500, subtotal: 6500 }],
    total: 6500,
    pago: { tarjeta: '•••• 1111' },
    ...cambios
  }
}
