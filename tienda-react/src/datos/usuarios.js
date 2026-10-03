// Cuentas de usuario y sesion activa.
// Las cuentas base son las mismas de js/sesion.js del sitio en HTML.
// Las cuentas que se crean con el registro se guardan en localStorage.

export const CLAVE_USUARIOS = "usuariosSistema";
export const CLAVE_SESION = "usuarioActivo";

export const USUARIOS_BASE = [
  {
    nombre: "Sofía Pérez",
    correo: "admin@gaselvolcan.cl",
    contrasena: "Admin1234",
    rol: "ADMINISTRADOR"
  },
  {
    nombre: "Daniela Fuentes",
    correo: "despachadora@gaselvolcan.cl",
    contrasena: "Desp123",
    rol: "DESPACHADORA"
  },
  {
    nombre: "Matías Vera",
    correo: "repartidor@gaselvolcan.cl",
    contrasena: "Repart123",
    rol: "REPARTIDOR"
  },
  {
    nombre: "Rodrigo Peña",
    correo: "repartidor2@gaselvolcan.cl",
    contrasena: "Repart123",
    rol: "REPARTIDOR"
  },
  {
    nombre: "Camila Rojas",
    correo: "cliente@gmail.com",
    contrasena: "Clien1234",
    rol: "CLIENTE"
  }
];

// Cuentas creadas con el registro (vacio si no hay o si esta danado)
function leerRegistrados() {
  try {
    const guardado = localStorage.getItem(CLAVE_USUARIOS);
    const lista = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

// Todas las cuentas: las registradas mas las base que no esten repetidas
export function leerUsuarios() {
  const registrados = leerRegistrados();

  const base = USUARIOS_BASE.filter((cuenta) =>
    !registrados.some((r) => r.correo.toLowerCase() === cuenta.correo)
  );

  return [...registrados, ...base];
}

// Devuelve la cuenta que coincide con el correo y la contrasena, o null
export function buscarCuenta(correo, contrasena) {
  const limpio = correo.trim().toLowerCase();

  return leerUsuarios().find((cuenta) =>
    cuenta.correo.toLowerCase() === limpio && cuenta.contrasena === contrasena.trim()
  ) || null;
}

// ---------- Sesion ----------

// Solo se guarda lo necesario: nunca la contrasena
export function leerSesion() {
  try {
    const guardado = localStorage.getItem(CLAVE_SESION);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(usuario) {
  if (usuario) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
  } else {
    localStorage.removeItem(CLAVE_SESION);
  }
}

// "Camila Rojas" -> "CR"
export function iniciales(nombre) {
  const partes = String(nombre).trim().split(/\s+/);

  if (partes.length === 1) {
    return partes[0].slice(0, 2).toUpperCase();
  }

  return (partes[0][0] + partes[1][0]).toUpperCase();
}

export function nombreDeRol(rol) {
  const nombres = {
    ADMINISTRADOR: "Administrador",
    DESPACHADORA: "Despachadora",
    REPARTIDOR: "Repartidor"
  };

  return nombres[rol] || "Cliente";
}
