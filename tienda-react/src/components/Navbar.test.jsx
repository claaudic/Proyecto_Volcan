import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Navbar from './Navbar'
import Login from '../paginas/Login'
import ProveedorSesion from '../contexto/ProveedorSesion'
import ProveedorCarrito from '../contexto/ProveedorCarrito'
import ProveedorCatalogo from '../contexto/ProveedorCatalogo'
import { renderizar, ADMIN, CLIENTE } from '../test/renderizar'
import { guardarSesionDePrueba } from '../test/api'
import { CLAVE_SESION } from '../datos/usuarios'

// Pruebas de eventos de la barra de navegacion

// La barra arriba y el login real abajo, como en la tienda
function abrirConLogin(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ProveedorSesion>
        <ProveedorCatalogo>
          <ProveedorCarrito>
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<h1>Otra página</h1>} />
            </Routes>
          </ProveedorCarrito>
        </ProveedorCatalogo>
      </ProveedorSesion>
    </MemoryRouter>
  )
}

describe('Navbar', () => {

  it('Salir cierra la sesión y vuelve a mostrar Ingresar', async () => {
    // 1 Preparar: Camila con la sesion iniciada
    const user = userEvent.setup()
    guardarSesionDePrueba(CLIENTE)
    abrirConLogin('/')

    // 2 Actuar
    await user.click(screen.getByRole('button', { name: 'Salir' }))

    // 3 Comprobar
    expect(screen.getByRole('link', { name: 'Ingresar' })).toBeInTheDocument()
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('al salir lleva al login y se despide con el primer nombre', async () => {
    const user = userEvent.setup()
    guardarSesionDePrueba(CLIENTE)
    abrirConLogin('/perfil')

    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(screen.getByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument()
    expect(screen.getByText('Cerraste sesión. ¡Hasta pronto, Camila!')).toHaveAttribute('role', 'status')
  })

  it('al administrador le muestra la insignia que lleva a su panel', () => {
    renderizar(<Navbar />, { usuario: ADMIN })

    expect(screen.getByRole('link', { name: 'Administrador' })).toHaveAttribute('href', '/admin')
  })

  it('marca la página actual en el menú', () => {
    renderizar(<Navbar />, { ruta: '/productos' })

    expect(screen.getByRole('link', { name: 'Productos' })).toHaveAttribute('aria-current', 'page')
  })

  it('incluye enlace a ofertas', () => {
    renderizar(<Navbar />)

    expect(screen.getByRole('link', { name: 'Ofertas' })).toHaveAttribute('href', '/ofertas')
  })

})
