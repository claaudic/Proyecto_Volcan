import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminProductos from './AdminProductos'
import AdminUsuarios from './AdminUsuarios'
import { renderizar, ADMIN } from '../test/renderizar'
import { simularBackendDeUsuarios, simularApiApagada } from '../test/api'
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

describe('Gestión de usuarios (con ms-usuarios simulado)', () => {

  let backend

  beforeEach(() => {
    backend = simularBackendDeUsuarios()
  })

  const cuenta = (correo) => backend.cuentas().find((c) => c.correo === correo)

  async function abrirAdmin() {
    renderizar(<AdminUsuarios />, { usuario: ADMIN })
    // Espera a que llegue la lista del backend
    await screen.findByText('camila@gmail.com')
  }

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

  it('lista las 5 cuentas que entrega el backend, con nombre completo', async () => {
    await abrirAdmin()

    expect(screen.getAllByRole('row')).toHaveLength(6)
    expect(screen.getByText('Camila Rojas')).toBeInTheDocument()
  })

  it('crea un repartidor con POST /usuarios y aparece en la tabla', async () => {
    // 1 Preparar
    const user = userEvent.setup()
    await abrirAdmin()

    // 2 Actuar
    await abrirCrear(user)
    await llenar(user, NUEVO)
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    // 3 Comprobar: el backend lo recibió con el token y aparece en la tabla
    expect(await screen.findByText('pedro.soto@gaselvolcan.cl')).toBeInTheDocument()
    expect(cuenta('pedro.soto@gaselvolcan.cl')).toMatchObject({
      run: '190110222', nombre: 'Pedro', apellidos: 'Soto Díaz', rol: 'REPARTIDOR', comuna: 'Chillán', region: 'Ñuble'
    })
    const envio = backend.api.mock.calls.find(([, opciones]) => opciones.method === 'POST')
    expect(envio[1].headers.Authorization).toMatch(/^Bearer /)
  })

  it('rechaza un RUN con dígito verificador incorrecto sin llamar al backend', async () => {
    const user = userEvent.setup()
    await abrirAdmin()

    await abrirCrear(user)
    await llenar(user, { ...NUEVO, runUsuario: '190110221' })
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(screen.getByText('Ese RUN no es válido. Revisa el dígito verificador.')).toBeInTheDocument()
    expect(cuenta('pedro.soto@gaselvolcan.cl')).toBeUndefined()
  })

  it('marca todos los errores si se envía vacío', async () => {
    const user = userEvent.setup()
    await abrirAdmin()

    await abrirCrear(user)
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(screen.getByText('Ingresa el RUN.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa el nombre.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa los apellidos.')).toBeInTheDocument()
    expect(screen.getByText('Selecciona un rol.')).toBeInTheDocument()
  })

  it('pide calle y número en la dirección, igual que el registro', async () => {
    const user = userEvent.setup()
    await abrirAdmin()

    await abrirCrear(user)
    await llenar(user, { ...NUEVO, direccionUsuario: 'Calle sin numero' })
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(screen.getByText('Escribe la calle y el número, por ejemplo: Libertad 123.')).toBeInTheDocument()
    expect(cuenta('pedro.soto@gaselvolcan.cl')).toBeUndefined()
  })

  it('no acepta una fecha de nacimiento futura', async () => {
    const user = userEvent.setup()
    await abrirAdmin()

    await abrirCrear(user)
    await llenar(user, { ...NUEVO, nacimientoUsuario: '2999-01-01' })
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(screen.getByText('La fecha de nacimiento no puede ser una fecha futura.')).toBeInTheDocument()
    expect(cuenta('pedro.soto@gaselvolcan.cl')).toBeUndefined()
  })

  it('muestra el mensaje del backend si el correo ya existe', async () => {
    const user = userEvent.setup()
    await abrirAdmin()

    await abrirCrear(user)
    await llenar(user, { ...NUEVO, correoUsuario: 'camila@gmail.com' })
    await user.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect((await screen.findAllByRole('alert')).some((a) => a.textContent.includes('Ya existe un usuario con ese correo.'))).toBe(true)
  })

  it('edita los apellidos con PUT /usuarios/{id}, sin perder el teléfono', async () => {
    backend.cuentas().find((c) => c.correo === 'camila@gmail.com').telefono = '+56 9 1234 5678'
    const user = userEvent.setup()
    await abrirAdmin()

    await user.click(within(filaCon('camila@gmail.com')).getByRole('button', { name: 'Editar' }))
    expect(porId('nombreUsuario')).toHaveValue('Camila')
    expect(porId('apellidosUsuario')).toHaveValue('Rojas')

    await llenar(user, { apellidosUsuario: 'Rojas Díaz' })
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Camila Rojas Díaz')).toBeInTheDocument()
    expect(cuenta('camila@gmail.com').telefono).toBe('+56 9 1234 5678')
  })

  it('al editar su propia cuenta, el administrador no puede cambiar su correo ni su rol', async () => {
    const user = userEvent.setup()
    await abrirAdmin()

    await user.click(within(filaCon('admin@gaselvolcan.cl')).getByRole('button', { name: 'Editar' }))

    expect(porId('correoUsuario')).toBeDisabled()
    expect(porId('rolUsuarioForm')).toBeDisabled()
  })

  it('desactiva una cuenta y la vuelve a activar', async () => {
    const user = userEvent.setup()
    await abrirAdmin()

    await user.click(within(filaCon('camila@gmail.com')).getByRole('button', { name: 'Desactivar' }))
    expect(await within(filaCon('camila@gmail.com')).findByText('Inactivo')).toBeInTheDocument()
    expect(cuenta('camila@gmail.com').activo).toBe(false)

    await user.click(within(filaCon('camila@gmail.com')).getByRole('button', { name: 'Activar' }))
    expect(await within(filaCon('camila@gmail.com')).findByText('Activo')).toBeInTheDocument()
    expect(cuenta('camila@gmail.com').activo).toBe(true)
  })

  it('elimina una cuenta con DELETE solo después de confirmar', async () => {
    const user = userEvent.setup()
    await abrirAdmin()

    // Cancelar no borra nada
    await user.click(within(filaCon('repartidor2@gaselvolcan.cl')).getByRole('button', { name: 'Eliminar' }))
    await user.click(screen.getAllByRole('button', { name: 'Cancelar' }).at(-1))
    expect(cuenta('repartidor2@gaselvolcan.cl')).toBeDefined()

    // Confirmar sí
    await user.click(within(filaCon('repartidor2@gaselvolcan.cl')).getByRole('button', { name: 'Eliminar' }))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    await waitFor(() => expect(screen.queryByText('repartidor2@gaselvolcan.cl')).toBeNull())
    expect(cuenta('repartidor2@gaselvolcan.cl')).toBeUndefined()
  })

  it('no deja desactivar ni eliminar la propia cuenta', async () => {
    const user = userEvent.setup()
    await abrirAdmin()

    await user.click(within(filaCon('admin@gaselvolcan.cl')).getByRole('button', { name: 'Desactivar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No puedes desactivar tu propia cuenta.')

    await user.click(within(filaCon('admin@gaselvolcan.cl')).getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('No puedes eliminar tu propia cuenta.')
  })

  it('si el backend no responde, lo avisa', async () => {
    simularApiApagada()
    renderizar(<AdminUsuarios />, { usuario: ADMIN })

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la lista de usuarios.')
  })

})
