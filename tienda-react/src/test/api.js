import { vi } from 'vitest'
import { API_URL } from '../utilidades/api'
import { CLAVE_SESION } from '../datos/usuarios'

// Ayuda para probar las pantallas que llaman al backend sin encenderlo.
// Reemplaza fetch por un backend de mentira que responde lo que le indicamos:
//
//   simularApi({
//     'POST /auth/login': (cuerpo) => [200, respuestaLogin(CUENTAS.camila)],
//     'GET /usuarios/yo': () => [200, CUENTAS.camila]
//   })
//
// Si se llama a una ruta que no esta en la lista, responde 404.
// setup.js restaura el fetch real al terminar cada prueba.

// Las cuentas de la EP2, como las devuelve el backend (sin contrasena)
export const CUENTAS = {
  admin: { id: 1, nombre: 'Sofía', apellidos: 'Pérez', correo: 'admin@gaselvolcan.cl', rol: 'ADMINISTRADOR', activo: true },
  despachadora: { id: 2, nombre: 'Daniela', apellidos: 'Fuentes', correo: 'despachadora@gaselvolcan.cl', rol: 'DESPACHADORA', activo: true },
  repartidor: { id: 3, nombre: 'Matías', apellidos: 'Vera', correo: 'repartidor@gaselvolcan.cl', rol: 'REPARTIDOR', activo: true },
  repartidor2: { id: 4, nombre: 'Rodrigo', apellidos: 'Peña', correo: 'repartidor2@gaselvolcan.cl', rol: 'REPARTIDOR', activo: true },
  camila: { id: 5, nombre: 'Camila', apellidos: 'Rojas', correo: 'camila@gmail.com', rol: 'CLIENTE', activo: true }
}

export function simularApi(rutas) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opciones = {}) => {
    const ruta = (opciones.method || 'GET') + ' ' + String(url).replace(API_URL, '')
    const manejador = rutas[ruta]

    if (!manejador) {
      return responder(404, { estado: 404, mensaje: 'La ruta no existe.' })
    }

    const cuerpo = opciones.body ? JSON.parse(opciones.body) : undefined
    const [estado, datos] = await manejador(cuerpo, opciones.headers || {})
    return responder(estado, datos)
  })
}

// Las listas de cuentas que piden los paneles (las 5 cuentas de la EP2)
export function simularApiDeUsuarios() {
  return simularApi({
    'GET /usuarios': () => [200, Object.values(CUENTAS)],
    'GET /usuarios/repartidores': () => [200, [CUENTAS.repartidor, CUENTAS.repartidor2]]
  })
}

// Un ms-usuarios de mentira CON MEMORIA, para Admin Usuarios:
// parte con las 5 cuentas de la EP2 y responde GET, POST, PUT y DELETE /usuarios.
// Devuelve { api, cuentas } para revisar qué quedó "guardado".
export function simularBackendDeUsuarios() {
  let cuentas = Object.values(CUENTAS).map((cuenta) => ({ ...cuenta }))
  let siguienteId = 100
  const existe = (correo, salvoId) => cuentas.some((c) => c.correo === correo && c.id !== salvoId)
  const repetido = [400, { estado: 400, mensaje: 'Ya existe un usuario con ese correo.' }]

  const api = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, opciones = {}) => {
    const metodo = opciones.method || 'GET'
    const ruta = String(url).replace(API_URL, '')
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : undefined
    const id = Number(ruta.split('/')[2])

    if (metodo === 'GET' && ruta === '/usuarios') {
      return responder(200, cuentas)
    }
    if (metodo === 'POST' && ruta === '/usuarios') {
      if (existe(cuerpo.correo)) return responder(...repetido)
      const nueva = { ...cuerpo, id: siguienteId++, activo: true }
      delete nueva.contrasena
      cuentas.push(nueva)
      return responder(201, nueva)
    }
    if (metodo === 'PUT' && cuentas.some((c) => c.id === id)) {
      if (existe(cuerpo.correo, id)) return responder(...repetido)
      cuentas = cuentas.map((c) => c.id === id
        ? { ...c, ...cuerpo, contrasena: undefined, activo: cuerpo.activo ?? c.activo }
        : c)
      return responder(200, cuentas.find((c) => c.id === id))
    }
    if (metodo === 'DELETE' && cuentas.some((c) => c.id === id)) {
      cuentas = cuentas.filter((c) => c.id !== id)
      return responder(204)
    }
    return responder(404, { estado: 404, mensaje: 'La ruta no existe.' })
  })

  return { api, cuentas: () => cuentas }
}

// El backend apagado: fetch falla sin respuesta
export function simularApiApagada() {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
}

function responder(estado, datos) {
  return new Response(estado === 204 ? null : JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Un token con la misma forma que el de ms-usuarios (la firma es falsa:
// el frontend no la revisa, solo lee el correo, el rol y cuando vence)
export function tokenDePrueba(correo, rol, minutos = 30) {
  const codificar = (objeto) => btoa(JSON.stringify(objeto)).replace(/=+$/, '')
  const ahora = Math.floor(Date.now() / 1000)
  const contenido = { sub: correo, rol, iat: ahora, exp: ahora + minutos * 60 }
  return codificar({ alg: 'HS256' }) + '.' + codificar(contenido) + '.firma-de-prueba'
}

// Lo que responde POST /auth/login o /auth/renovar
export function respuestaLogin(cuenta, minutos = 30) {
  return {
    token: tokenDePrueba(cuenta.correo, cuenta.rol, minutos),
    tipo: 'Bearer',
    expiraEnSegundos: minutos * 60,
    usuario: cuenta
  }
}

// Deja la sesion iniciada en localStorage, como si ya se hubiera entrado.
// usuario: { nombre, correo, rol } (el nombre completo, como lo guarda ProveedorSesion)
export function guardarSesionDePrueba(usuario, minutos = 30) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify({
    token: tokenDePrueba(usuario.correo, usuario.rol, minutos),
    usuario
  }))
}
