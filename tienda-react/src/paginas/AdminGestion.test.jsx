import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminProductos from './AdminProductos'
import AdminUsuarios from './AdminUsuarios'
import { renderizar, ADMIN } from '../test/renderizar'
import { buscarUsuario, buscarCuenta } from '../datos/usuarios'
import { CLAVE_CATALOGO } from '../datos/catalogo'

// Pruebas de los formularios del administrador:
// editar productos, validarlos y gestionar las cuentas de usuario.

// jsdom no implementa scrollIntoView (lo usa el formulario al abrirse)
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

function porId(id) {
  return document.getElementById(id)
}

function filaCon(texto) {
  return screen.getAllByRole('row').find((fila) => fila.textContent.includes(texto))
}

function productoGuardado(codigo) {
  return JSON.parse(localStorage.getItem(CLAVE_CATALOGO)).find((p) => p.codigo === codigo)
}

describe('Gestión de productos', () => {

  it('edita el precio de un producto', async () => {
    // 1 Preparar
    const user = userEvent.setup()
    renderizar(<AdminProductos />, { usuario: ADMIN })

    // 2 Actuar: editar el Cilindro GLP 5 kg y cambiar su precio
    await user.click(within(filaCon('CL001')).getByRole('button', { name: 'Editar' }))
    await user.clear(porId('precioResidencialProducto'))
    await user.type(porId('precioResidencialProducto'), '7000')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    // 3 Comprobar
    expect(productoGuardado('CL001').precioResidencial).toBe(7000)
  })

  it('no guarda si faltan datos o el código ya existe', async () => {
    const user = userEvent.setup()
    renderizar(<AdminProductos />, { usuario: ADMIN })

    await user.click(screen.getByRole('button', { name: /Crear producto/ }))
    await user.type(porId('codigoProducto'), 'CL001')
    await user.type(porId('stockProducto'), '-1')
    await user.click(screen.getByRole('button', { name: 'Agregar producto' }))

    expect(screen.getByText('Ya existe un producto con ese código.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa el nombre del producto.')).toBeInTheDocument()
    expect(screen.getByText('Selecciona una categoría.')).toBeInTheDocument()
    expect(screen.getByText('El stock debe ser un número entero mayor o igual a 0.')).toBeInTheDocument()
  })

  it('pide al menos 3 caracteres en el código y un stock crítico válido', async () => {
    const user = userEvent.setup()
    renderizar(<AdminProductos />, { usuario: ADMIN })

    await user.click(screen.getByRole('button', { name: /Crear producto/ }))
    await user.type(porId('codigoProducto'), 'AB')
    await user.type(porId('stockCriticoProducto'), '2.5')
    await user.click(screen.getByRole('button', { name: 'Agregar producto' }))

    expect(screen.getByText('El código debe tener al menos 3 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('El stock crítico debe ser un número entero mayor o igual a 0.')).toBeInTheDocument()
  })

  it('desactiva y vuelve a activar un producto', async () => {
    const user = userEvent.setup()
    renderizar(<AdminProductos />, { usuario: ADMIN })

    await user.click(within(filaCon('CL001')).getByRole('button', { name: 'Desactivar' }))
    expect(productoGuardado('CL001').activo).toBe(false)

    await user.click(within(filaCon('CL001')).getByRole('button', { name: 'Activar' }))
    expect(productoGuardado('CL001').activo).toBe(true)
  })

  it('cancelar el formulario no cambia nada', async () => {
    const user = userEvent.setup()
    renderizar(<AdminProductos />, { usuario: ADMIN })

    await user.click(screen.getByRole('button', { name: /Crear producto/ }))
    await user.click(screen.getAllByRole('button', { name: 'Cancelar' })[0])

    expect(porId('codigoProducto')).toBeNull()
  })

})

describe('Gestión de usuarios', () => {

  async function abrirCrear(user) {
    await user.click(screen.getByRole('button', { name: /Crear usuario/ }))
  }

  async function llenar(user, datos) {
    for (const [id, valor] of Object.entries(datos)) {
      const campo = porId(id)
      if (campo.tagName === 'SELECT') {
        await user.selectOptions(campo, valor)
      } else {
        await user.clear(campo)
        await user.type(campo, valor)
      }
    }
  }

  const NUEVO = {
    runUsuario: '190110222',
    nombreUsuario: 'Pedro',
    apellidosUsuario: 'Soto Díaz',
    correoUsuario: 'pedro.soto@gaselvolcan.cl',
    contrasenaUsuario: 'Pedro123',
    comunaUsuario: 'Chillán',
    direccionUsuario: 'Libertad 123',
    rolUsuarioForm: 'REPARTIDOR'
  }

  it('crea un repartidor con RUN válido y puede iniciar sesión', async () => {
    // 1 Preparar
    const user = userEvent.setup()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    // 2 Actuar
    await abrirCrear(user)
    await llenar(user, NUEVO)
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    // 3 Comprobar: aparece en la tabla y su cuenta funciona
    expect(filaCon('pedro.soto@gaselvolcan.cl')).toBeDefined()
    expect(buscarCuenta('pedro.soto@gaselvolcan.cl', 'Pedro123').nombre).toBe('Pedro Soto Díaz')
  })

  it('rechaza un RUN con dígito verificador incorrecto', async () => {
    const user = userEvent.setup()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    await abrirCrear(user)
    await llenar(user, { ...NUEVO, runUsuario: '190110221' })
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(screen.getByText('Ese RUN no es válido. Revisa el dígito verificador.')).toBeInTheDocument()
    expect(buscarUsuario('pedro.soto@gaselvolcan.cl')).toBeNull()
  })

  it('marca todos los errores si se envía vacío', async () => {
    const user = userEvent.setup()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    await abrirCrear(user)
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(screen.getByText('Ingresa el RUN.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa el nombre.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa los apellidos.')).toBeInTheDocument()
    expect(screen.getByText('Selecciona un rol.')).toBeInTheDocument()
  })

  it('no deja repetir un correo que ya existe', async () => {
    const user = userEvent.setup()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    await abrirCrear(user)
    await llenar(user, { ...NUEVO, correoUsuario: 'camila@gmail.com' })
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(screen.getAllByRole('alert').some((a) => a.textContent.includes('Ya existe un usuario con ese correo.'))).toBe(true)
  })

  it('edita el nombre de una cuenta', async () => {
    const user = userEvent.setup()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    await user.click(within(filaCon('camila@gmail.com')).getByRole('button', { name: 'Editar' }))
    expect(porId('nombreUsuario')).toHaveValue('Camila')
    expect(porId('apellidosUsuario')).toHaveValue('Rojas')

    await llenar(user, { apellidosUsuario: 'Rojas Díaz' })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(buscarUsuario('camila@gmail.com').nombre).toBe('Camila Rojas Díaz')
  })

  it('al editar su propia cuenta, el administrador no puede cambiar su correo ni su rol', async () => {
    const user = userEvent.setup()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    await user.click(within(filaCon('admin@gaselvolcan.cl')).getByRole('button', { name: 'Editar' }))

    expect(porId('correoUsuario')).toBeDisabled()
    expect(porId('rolUsuarioForm')).toBeDisabled()
  })

  it('desactiva una cuenta, que ya no puede entrar, y la vuelve a activar', async () => {
    const user = userEvent.setup()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    await user.click(within(filaCon('camila@gmail.com')).getByRole('button', { name: 'Desactivar' }))
    expect(buscarUsuario('camila@gmail.com').activo).toBe(false)

    await user.click(within(filaCon('camila@gmail.com')).getByRole('button', { name: 'Activar' }))
    expect(buscarUsuario('camila@gmail.com').activo).toBe(true)
  })

  it('elimina una cuenta solo después de confirmar', async () => {
    const user = userEvent.setup()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    // Cancelar no borra nada
    await user.click(within(filaCon('repartidor2@gaselvolcan.cl')).getByRole('button', { name: 'Eliminar' }))
    await user.click(screen.getAllByRole('button', { name: 'Cancelar' }).at(-1))
    expect(buscarUsuario('repartidor2@gaselvolcan.cl')).not.toBeNull()

    // Confirmar si
    await user.click(within(filaCon('repartidor2@gaselvolcan.cl')).getByRole('button', { name: 'Eliminar' }))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    expect(buscarUsuario('repartidor2@gaselvolcan.cl')).toBeNull()
  })

  it('no deja desactivar la propia cuenta', async () => {
    const user = userEvent.setup()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    await user.click(within(filaCon('admin@gaselvolcan.cl')).getByRole('button', { name: 'Desactivar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('No puedes desactivar tu propia cuenta.')
  })

})
