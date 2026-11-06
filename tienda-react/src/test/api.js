import { vi } from 'vitest'
import { API_USUARIOS } from '../utilidades/api'
import { CLAVE_SESION } from '../datos/usuarios'

// Ayuda para probar las pantallas que llaman a ms-usuarios sin encender el backend.
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
    const ruta = (opciones.method || 'GET') + ' ' + String(url).replace(API_USUARIOS, '')
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
