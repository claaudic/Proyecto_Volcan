import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CLAVE_INTENTO_COMPRA, TRANSICIONES_INTENTO, crearIntentoCompra, leerIntentoCompra,
  recuperarIntentoCompra, cambiarEstadoIntento, registrarRespuestaIntento, descartarIntentoCompra } from './intentoCompra'

const identidad = { tipo: 'autenticado', clienteId: 7, rol: 'CLIENTE' }
const invitado = { tipo: 'invitado' }
const UUID = 'a1b2c3d4-1111-4222-8333-123456789abc'
const solicitud = () => ({ clienteId: 7, direccion: 'Calle de prueba 123', comuna: 'Temuco',
  estado: 'PENDIENTE', repartidorId: null, fecha: '2026-11-10T12:30:00',
  detalles: [{ productoId: 1, cantidad: 1 }, { productoId: 2, cantidad: 2 }] })
const solicitudInvitado = () => ({ ...solicitud(), clienteId: null,
  nombreInvitado: 'Persona de prueba', correoInvitado: 'prueba@example.com', telefonoInvitado: '+56 (9) 1234-5678' })
const crear = () => crearIntentoCompra(solicitud(), identidad)
const enviado = () => { const intento = crear(); return cambiarEstadoIntento(intento.clave, 'enviado') }
beforeEach(() => {
  sessionStorage.clear()
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(UUID)
})
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear() })

describe('Intentos de compra conservados por pestana', () => {
  it('crea UUID seguro y persiste un intento preparado', () => {
    expect(crear()).toMatchObject({ clave: UUID, estado: 'preparado', boletaId: null, identidad })
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
    expect(JSON.parse(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).cuerpo).toEqual(solicitud())
  })
  it('recupera despues de recargar el modulo con el mismo UUID, fecha y cuerpo', async () => {
    const original = crear()
    vi.resetModules()
    const recargado = await import('./intentoCompra')
    expect(recargado.recuperarIntentoCompra(identidad)).toEqual(original)
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })
  it('congela profundamente sin congelar el formulario original', () => {
    const cuerpo = solicitud()
    const usuario = { ...identidad }
    const intento = crearIntentoCompra(cuerpo, usuario)
    cuerpo.fecha = '2027-01-01T00:00:00'
    cuerpo.detalles[0].cantidad = 50
    usuario.clienteId = 90
    expect(intento.cuerpo).toEqual(solicitud())
    expect(intento.identidad).toEqual(identidad)
    expect(() => { intento.cuerpo.detalles[0].cantidad = 9 }).toThrow()
    expect(Object.isFrozen(leerIntentoCompra().cuerpo.detalles)).toBe(true)
  })
  it('admite identidad invitada sin clienteId autenticado', () => {
    const intento = crearIntentoCompra(solicitudInvitado(), invitado)
    expect(recuperarIntentoCompra(invitado)).toEqual(intento)
    expect(intento.cuerpo.clienteId).toBeNull()
  })
  it.each([{ tipo: 'invitado' }, { ...identidad, clienteId: 8 }, { ...identidad, rol: 'ADMIN' }])(
    'no convierte ni cambia una identidad autenticada: %j', otra => {
      crear()
      expect(() => recuperarIntentoCompra(otra)).toThrow('identidad cambio')
      expect(leerIntentoCompra().identidad).toEqual(identidad)
    })
  it('no convierte invitado a autenticado', () => {
    crearIntentoCompra(solicitudInvitado(), invitado)
    expect(() => recuperarIntentoCompra(identidad)).toThrow()
  })
  it('lectura vacia devuelve null y recuperar exige un intento', () => {
    expect(leerIntentoCompra()).toBeNull()
    expect(() => recuperarIntentoCompra(identidad)).toThrow()
  })
  it.each(['jwt', 'token', 'tarjeta', 'cvv', 'contrasena', 'password', 'precio', 'total', 'stock'])(
    'rechaza el campo adicional %s antes de almacenar', campo => {
      expect(() => crearIntentoCompra({ ...solicitud(), [campo]: 'secreto' }, identidad)).toThrow()
      expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).toBeNull()
      expect(crypto.randomUUID).not.toHaveBeenCalled()
    })
  it('rechaza secretos en identidad y en detalles', () => {
    expect(() => crearIntentoCompra(solicitud(), { ...identidad, jwt: 'secreto' })).toThrow()
    const cuerpo = solicitud()
    cuerpo.detalles[0].cvv = '123'
    expect(() => crearIntentoCompra(cuerpo, identidad)).toThrow()
    expect(sessionStorage.length).toBe(0)
  })
  it('solo guarda los campos permitidos', () => {
    crear()
    const registro = JSON.parse(sessionStorage.getItem(CLAVE_INTENTO_COMPRA))
    expect(Object.keys(registro).sort()).toEqual(['version', 'clave', 'identidad', 'cuerpo', 'estado', 'boletaId'].sort())
    expect(Object.keys(registro.identidad).sort()).toEqual(['tipo', 'clienteId', 'rol'].sort())
    expect(JSON.stringify(registro)).not.toMatch(/jwt|token|tarjeta|cvv|password|contrasena/i)
  })
  it.each(['2026-02-30T12:00:00', '2026-11-10T12:30:00Z', '2026-11-10', '2026-13-10T12:30:00'])(
    'rechaza fecha invalida o con zona: %s', fecha => {
      expect(() => crearIntentoCompra({ ...solicitud(), fecha }, identidad)).toThrow()
    })
  it.each(['sin-arroba', 'persona @ejemplo.cl', 'a@b@c'])(
    'rechaza correo invalido: %s', correoInvitado => {
      expect(() => crearIntentoCompra({ ...solicitudInvitado(), correoInvitado }, invitado)).toThrow()
    })
  it.each(['abc12345', '123', '1234567890123456789012345678901'])(
    'rechaza telefono invalido: %s', telefonoInvitado => {
      expect(() => crearIntentoCompra({ ...solicitudInvitado(), telefonoInvitado }, invitado)).toThrow()
    })
  it.each([0, -1, 1.5, 2147483648])('rechaza cantidad %s', cantidad => {
    expect(() => crearIntentoCompra({ ...solicitud(), detalles: [{ productoId: 1, cantidad }] }, identidad)).toThrow()
  })
  it('rechaza identidad y clienteId distintos', () => {
    expect(() => crearIntentoCompra({ ...solicitud(), clienteId: 8 }, identidad)).toThrow()
  })
  it('no reemplaza datos corruptos ni genera UUID', () => {
    sessionStorage.setItem(CLAVE_INTENTO_COMPRA, '{roto')
    expect(() => leerIntentoCompra()).toThrow()
    expect(() => crear()).toThrow()
    expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).toBe('{roto')
    expect(crypto.randomUUID).not.toHaveBeenCalled()
  })
  it.each([
    r => { r.version = 2 }, r => { r.clave = 'no-uuid' }, r => { r.estado = 'desconocido' },
    r => { r.cuerpo.detalles[0].cantidad = 0 }, r => { r.cuerpo.token = 'secreto' },
    r => { r.identidad.clienteId = 8 }, r => { r.boletaId = 1 },
    r => { r.estado = 'confirmado' }, r => { r.jwt = 'secreto' },
  ])('rechaza registro persistido alterado %#', alterar => {
    const registro = JSON.parse(JSON.stringify(crear()))
    alterar(registro)
    const texto = JSON.stringify(registro)
    sessionStorage.setItem(CLAVE_INTENTO_COMPRA, texto)
    expect(() => leerIntentoCompra()).toThrow()
    expect(() => crear()).toThrow()
    expect(sessionStorage.getItem(CLAVE_INTENTO_COMPRA)).toBe(texto)
  })
  it('falla cerrado cuando la lectura del almacenamiento esta bloqueada', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
    expect(() => leerIntentoCompra()).toThrow('bloqueado')
    expect(() => crear()).toThrow('bloqueado')
    expect(crypto.randomUUID).not.toHaveBeenCalled()
  })
  it('no devuelve un intento utilizable si falla la persistencia', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('sin espacio') })
    expect(() => crear()).toThrow('sin espacio')
    expect(leerIntentoCompra()).toBeNull()
  })
  it('un fallo de escritura de estado conserva el registro anterior', () => {
    const original = enviado()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('sin espacio') })
    expect(() => registrarRespuestaIntento(UUID, 503)).toThrow()
    expect(leerIntentoCompra()).toEqual(original)
  })
  it('un fallo al quitar no pierde el intento', () => {
    crear()
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('bloqueado') })
    expect(() => descartarIntentoCompra(UUID)).toThrow()
    expect(leerIntentoCompra()).not.toBeNull()
  })
})

describe('Transiciones explicitas e idempotencia', () => {
  const estados = Object.keys(TRANSICIONES_INTENTO)
  function alcanzar(estado) {
    crear()
    if (estado !== 'preparado') cambiarEstadoIntento(UUID, 'enviado')
    if (!['preparado', 'enviado'].includes(estado)) cambiarEstadoIntento(UUID, estado, { boletaId: estado === 'confirmado' ? 51 : null })
  }
  it.each(estados.flatMap(desde => estados.map(hasta => [desde, hasta])))(
    'verifica transicion %s -> %s', (desde, hasta) => {
      alcanzar(desde)
      const original = leerIntentoCompra()
      const cambiar = () => cambiarEstadoIntento(UUID, hasta, { boletaId: hasta === 'confirmado' ? 51 : null })
      // Matriz esperada independiente de la tabla de implementacion.
      const permitidas = {
        preparado: ['enviado'], enviado: ['enviado', 'incierto', 'bloqueado', 'conflicto', 'confirmado'],
        incierto: ['enviado', 'confirmado'], bloqueado: ['enviado', 'confirmado'],
        conflicto: ['enviado', 'confirmado'], confirmado: ['confirmado'],
      }
      if (permitidas[desde].includes(hasta)) expect(cambiar().estado).toBe(hasta)
      else { expect(cambiar).toThrow(); expect(leerIntentoCompra()).toEqual(original) }
    })
  it('confirma con boletaId y lo conserva en lecturas y confirmaciones repetidas', () => {
    enviado()
    registrarRespuestaIntento(UUID, 201, 51)
    expect(cambiarEstadoIntento(UUID, 'confirmado').boletaId).toBe(51)
    expect(recuperarIntentoCompra(identidad).boletaId).toBe(51)
    expect(() => cambiarEstadoIntento(UUID, 'confirmado', { boletaId: 52 })).toThrow()
    expect(() => registrarRespuestaIntento(UUID, 503)).toThrow()
    expect(leerIntentoCompra()).toMatchObject({ estado: 'confirmado', boletaId: 51 })
  })
  it('una respuesta 201 sin boletaId no confirma', () => {
    enviado()
    expect(() => registrarRespuestaIntento(UUID, 201)).toThrow()
    expect(leerIntentoCompra().estado).toBe('enviado')
  })
  it.each([[0, 'incierto'], [503, 'incierto'], [502, 'incierto'], [200, 'incierto'], [400, 'incierto'],
    [401, 'bloqueado'], [403, 'bloqueado'], [409, 'conflicto']])('HTTP %s conserva el intento como %s', (http, estado) => {
    const original = enviado()
    registrarRespuestaIntento(UUID, http)
    expect(leerIntentoCompra()).toMatchObject({ clave: original.clave, cuerpo: original.cuerpo, estado })
    expect(() => crear()).toThrow()
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })
  it.each(['enviado', 'incierto', 'bloqueado', 'conflicto'])('no descarta ni reemplaza %s', estado => {
    alcanzar(estado)
    const original = leerIntentoCompra()
    expect(() => descartarIntentoCompra(UUID)).toThrow()
    expect(() => crear()).toThrow()
    expect(leerIntentoCompra()).toEqual(original)
  })
  it.each(['preparado', 'confirmado'])('solo descarta explicitamente %s', estado => {
    alcanzar(estado)
    descartarIntentoCompra(UUID)
    expect(leerIntentoCompra()).toBeNull()
  })
  it('mantiene UUID y cuerpo exactos durante recuperaciones y reintentos', () => {
    const original = enviado()
    const cuerpo = JSON.stringify(original.cuerpo)
    registrarRespuestaIntento(UUID, 503)
    const recuperado = recuperarIntentoCompra(identidad)
    cambiarEstadoIntento(recuperado.clave, 'enviado')
    registrarRespuestaIntento(UUID, 0)
    expect(JSON.stringify(recuperarIntentoCompra(identidad).cuerpo)).toBe(cuerpo)
    expect(leerIntentoCompra().clave).toBe(UUID)
    expect(crypto.randomUUID).toHaveBeenCalledTimes(1)
  })
  it('rechaza clave ajena sin modificar el registro', () => {
    const original = enviado()
    expect(() => cambiarEstadoIntento('otra', 'incierto')).toThrow()
    expect(() => descartarIntentoCompra('otra')).toThrow()
    expect(leerIntentoCompra()).toEqual(original)
  })
})
