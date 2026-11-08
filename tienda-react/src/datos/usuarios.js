// Ayudas sobre la cuenta y la sesion.
// Desde la EP3 las cuentas viven en ms-usuarios (MySQL): aqui ya no se
// guardan usuarios en el navegador, solo la sesion { token, usuario }.

// La sesion guarda { token, usuario }. El token lo entrega ms-usuarios.
export const CLAVE_SESION = "sesionVolcan"

// =========================================
// SESIÓN
// =========================================

export function leerSesion() {
  try {
    const guardado = localStorage.getItem(CLAVE_SESION)
    return guardado ? JSON.parse(guardado) : null
  } catch {
    return null
  }
}

export function guardarSesion(sesion) {
  if (sesion) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  } else {
    localStorage.removeItem(CLAVE_SESION)
  }
}

// =========================================
// NOMBRE COMPLETO
// =========================================

// ms-usuarios manda nombre y apellidos por separado:
// { nombre: "Camila", apellidos: "Rojas" } -> "Camila Rojas"
export function nombreCompleto(cuenta) {
  return [cuenta?.nombre, cuenta?.apellidos]
      .filter(Boolean)
      .join(" ")
      .trim()
}

// =========================================
// INICIALES
// =========================================

// "Camila Rojas" -> "CR"
export function iniciales(nombre) {
  const partes = String(nombre).trim().split(/\s+/)

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase()
  }

  return (partes[0][0] + partes[1][0]).toUpperCase()
}

// =========================================
// NOMBRE DE ROL
// =========================================

export function nombreDeRol(rol) {
  const nombres = {
    ADMINISTRADOR: "Administrador",
    DESPACHADORA: "Despachadora",
    REPARTIDOR: "Repartidor"
  }

  return nombres[rol] || "Cliente"
}

// =========================================
// PANELES POR ROL
// =========================================

export const PANELES = {
  ADMINISTRADOR: "/admin",
  DESPACHADORA: "/despacho",
  REPARTIDOR: "/repartidor"
}

export function panelDeRol(rol) {
  return PANELES[rol] || null
}
