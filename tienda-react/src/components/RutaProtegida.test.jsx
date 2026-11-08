import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import App from '../App'
import ProveedorSesion from '../contexto/ProveedorSesion'
import ProveedorCatalogo from '../contexto/ProveedorCatalogo'
import ProveedorCarrito from '../contexto/ProveedorCarrito'
import { CLAVE_SESION } from '../datos/usuarios'
import { guardarSesionDePrueba, simularApi, respuestaLogin, CUENTAS } from '../test/api'

// Restricciones por rol (tarea 12), probadas con la App completa y sus rutas reales:
// sin sesion → login; con sesion pero otro rol → "No tienes permiso"; y cambiar
// el rol en el navegador no da permisos (el rol sale del token).

const SIN_PERMISO = 'No tienes permiso para ver esta página'

const SESIONES = {
    ADMINISTRADOR: { nombre: 'Sofía Pérez', correo: 'admin@gaselvolcan.cl', rol: 'ADMINISTRADOR' },
    DESPACHADORA: { nombre: 'Daniela Fuentes', correo: 'despachadora@gaselvolcan.cl', rol: 'DESPACHADORA' },
    REPARTIDOR: { nombre: 'Matías Vera', correo: 'repartidor@gaselvolcan.cl', rol: 'REPARTIDOR' },
    CLIENTE: { nombre: 'Camila Rojas', correo: 'camila@gmail.com', rol: 'CLIENTE' }
}

// Quién puede entrar a cada ruta privada (lo mismo que App.jsx y el backend)
const RUTAS = {
    '/admin': ['ADMINISTRADOR'],
    '/admin/usuarios': ['ADMINISTRADOR'],
    '/admin/productos': ['ADMINISTRADOR'],
    '/admin/ordenes': ['ADMINISTRADOR'],
    '/admin/reportes': ['ADMINISTRADOR'],
    '/despacho': ['DESPACHADORA'],
    '/repartidor': ['REPARTIDOR'],
    '/perfil': ['ADMINISTRADOR', 'DESPACHADORA', 'REPARTIDOR', 'CLIENTE']
}

function abrirApp(url) {
    return render(
        <MemoryRouter initialEntries={[url]}>
            <ProveedorSesion>
                <ProveedorCatalogo>
                    <ProveedorCarrito>
                        <App />
                    </ProveedorCarrito>
                </ProveedorCatalogo>
            </ProveedorSesion>
        </MemoryRouter>
    )
}

const enLogin = () => screen.queryByRole('heading', { name: 'Ingresa a tu cuenta' })

describe('Rutas privadas: los 4 roles', () => {

    const casos = Object.entries(RUTAS).flatMap(([ruta, permitidos]) =>
        Object.keys(SESIONES).map((rol) => [rol, ruta, permitidos.includes(rol)]))

    it.each(casos)('%s en %s → %s', (rol, ruta, puede) => {
        guardarSesionDePrueba(SESIONES[rol])
        abrirApp(ruta)

        if (puede) {
            expect(screen.queryByText(SIN_PERMISO)).toBeNull()
        } else {
            expect(screen.getByRole('heading', { name: SIN_PERMISO })).toBeInTheDocument()
        }
        // Con sesión nunca se manda al login
        expect(enLogin()).toBeNull()
    })

    it.each(Object.keys(RUTAS))('sin sesión, %s manda al login', (ruta) => {
        abrirApp(ruta)

        expect(enLogin()).toBeInTheDocument()
    })
})

describe('Sin permiso y vuelta después del login', () => {

    it('la página "sin permiso" ofrece ir al panel propio', () => {
        guardarSesionDePrueba(SESIONES.DESPACHADORA)
        abrirApp('/admin/usuarios')

        expect(screen.getByRole('link', { name: 'Ir a mi panel' })).toHaveAttribute('href', '/despacho')
    })

    it('después de iniciar sesión vuelve a la página que pedía', async () => {
        simularApi({
            'POST /auth/login': () => [200, respuestaLogin(CUENTAS.admin)],
            'GET /usuarios': () => [200, Object.values(CUENTAS)]
        })
        const user = userEvent.setup()
        abrirApp('/admin/usuarios')

        await user.type(screen.getByLabelText(/Correo/), 'admin@gaselvolcan.cl')
        await user.type(screen.getByLabelText(/Contraseña/), 'Admin1234')
        await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

        expect(await screen.findByRole('heading', { level: 1, name: 'Gestión de usuarios' })).toBeInTheDocument()
    })
})

describe('Cambiar datos del navegador no da permisos', () => {

    it('si se cambia "rol" a ADMINISTRADOR en el localStorage, sigue siendo cliente', () => {
        guardarSesionDePrueba(SESIONES.CLIENTE)
        const guardada = JSON.parse(localStorage.getItem(CLAVE_SESION))
        guardada.usuario.rol = 'ADMINISTRADOR'
        localStorage.setItem(CLAVE_SESION, JSON.stringify(guardada))

        abrirApp('/admin')

        // El rol se lee del token (firmado por ms-usuarios), que sigue diciendo CLIENTE
        expect(screen.getByRole('heading', { name: SIN_PERMISO })).toBeInTheDocument()
    })

    it('si el token fue alterado, el backend lo rechaza al abrir la app y se cierra la sesión', async () => {
        simularApi({ 'GET /usuarios/yo': () => [401, { estado: 401, mensaje: 'El token no es válido o ya venció. Inicia sesión de nuevo.' }] })
        guardarSesionDePrueba(SESIONES.ADMINISTRADOR)

        abrirApp('/admin')

        expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument()
        expect(localStorage.getItem(CLAVE_SESION)).toBeNull()
    })

    it('si el backend no responde, la sesión se mantiene', async () => {
        guardarSesionDePrueba(SESIONES.ADMINISTRADOR)

        abrirApp('/admin')

        expect(await screen.findByRole('heading', { name: /Panel de administración/ })).toBeInTheDocument()
        expect(localStorage.getItem(CLAVE_SESION)).not.toBeNull()
    })
})
