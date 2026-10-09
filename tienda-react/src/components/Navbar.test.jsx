import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navbar from './Navbar'
import { renderizar, ADMIN, CLIENTE } from '../test/renderizar'

// Pruebas de eventos de la barra de navegacion

describe('Navbar', () => {

  it('Salir cierra la sesión y vuelve a mostrar Ingresar', async () => {
    // 1 Preparar: Camila con la sesion iniciada
    const user = userEvent.setup()
    renderizar(<Navbar />, { usuario: CLIENTE })

    // 2 Actuar
    await user.click(screen.getByRole('button', { name: 'Salir' }))

    // 3 Comprobar
    expect(screen.getByRole('link', { name: 'Ingresar' })).toBeInTheDocument()
    expect(localStorage.getItem('usuarioActivo')).toBeNull()
  })

  it('al administrador le muestra la insignia que lleva a su panel', () => {
    renderizar(<Navbar />, { usuario: ADMIN })

    expect(screen.getByRole('link', { name: 'Administrador' })).toHaveAttribute('href', '/admin')
  })

  it('marca la página actual en el menú', () => {
    renderizar(<Navbar />, { ruta: '/productos' })

    expect(screen.getByRole('link', { name: 'Productos' })).toHaveAttribute('aria-current', 'page')
  })

})
