// Conexion con el backend (ms-usuarios).
// Todas las llamadas pasan por pedir(): arma la peticion, agrega el token
// y convierte los errores del backend en un mensaje que se puede mostrar.

// Direccion de ms-usuarios. Se puede cambiar con VITE_API_USUARIOS en un archivo .env
export const API_USUARIOS = import.meta.env.VITE_API_USUARIOS || "http://localhost:8081/api/v1"

export const SIN_CONEXION = "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo."
const ERROR_GENERAL = "Ocurrió un error inesperado. Intenta de nuevo."

// Un error que trae el codigo HTTP (401, 403...) y el mensaje del backend.
// estado 0 = el backend no respondio (apagado o sin internet).
export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje)
    this.estado = estado
  }
}

//   pedir("/auth/login", { metodo: "POST", cuerpo: { correo, contrasena } })
//   pedir("/usuarios/yo", { token })
export async function pedir(ruta, { metodo = "GET", cuerpo, token } = {}) {
  const encabezados = {}

  if (cuerpo !== undefined) {
    encabezados["Content-Type"] = "application/json"
  }
  if (token) {
    encabezados.Authorization = "Bearer " + token
  }

  let respuesta
  try {
    respuesta = await fetch(API_USUARIOS + ruta, {
      method: metodo,
      headers: encabezados,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    })
  } catch {
    throw new ErrorApi(0, SIN_CONEXION)
  }

  // 204 = salio bien, pero no trae datos (por ejemplo, al eliminar)
  if (respuesta.status === 204) {
    return null
  }

  // El backend siempre responde JSON; si no se puede leer, queda en null
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, datos?.mensaje || ERROR_GENERAL)
  }

  return datos
}

// Lee el contenido del token: { sub, rol, iat, exp }.
// No revisa la firma: eso lo hace el backend en cada peticion.
export function leerToken(token) {
  try {
    const contenido = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(contenido))
  } catch {
    return null
  }
}

// Cuantos milisegundos le quedan al token (0 o menos = vencido)
export function msHastaVencer(token, ahora = Date.now()) {
  const contenido = leerToken(token)
  return contenido?.exp ? contenido.exp * 1000 - ahora : 0
}
