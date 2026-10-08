// Cuentas de usuario y sesion activa.
// Las cuentas base son las mismas de js/sesion.js del sitio en HTML.
// Las cuentas que se crean con el registro se guardan en localStorage.

export const CLAVE_USUARIOS = "usuariosSistema";
export const CLAVE_SESION = "usuarioActivo";

// Las cuentas base estan escritas en el codigo y no se pueden borrar de ahi.
// Si un cliente base elimina su cuenta, su correo se anota en esta lista
// para no volver a mostrarla. Es lo mismo que hacia el sitio en HTML.
export const CLAVE_ELIMINADAS = "cuentasEliminadas";

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

function leerEliminadas() {
  try {
    const guardado = localStorage.getItem(CLAVE_ELIMINADAS);
    const lista = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

// Todas las cuentas: las registradas mas las base que no esten repetidas
// ni eliminadas
export function leerUsuarios() {
  const registrados = leerRegistrados();
  const eliminadas = leerEliminadas();

  const base = USUARIOS_BASE.filter((cuenta) =>
    !registrados.some((r) => r.correo.toLowerCase() === cuenta.correo) &&
    !eliminadas.includes(cuenta.correo)
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

// ¿Ya existe una cuenta con este correo?
export function correoRegistrado(correo) {
  const limpio = correo.trim().toLowerCase();
  return leerUsuarios().some((cuenta) => cuenta.correo.toLowerCase() === limpio);
}

// CREAR: guarda una cuenta de cliente nueva. Desde la tienda solo se crean
// clientes; las cuentas del equipo las crea el administrador.
// (En un sistema real la contrasena se guardaria con un hash en el servidor,
// nunca en texto en el navegador.)
export function registrarCliente(datos) {
  const registrados = leerRegistrados();

  const nueva = {
    nombre: (datos.nombre.trim() + " " + datos.apellidos.trim()).trim(),
    correo: datos.correo.trim().toLowerCase(),
    contrasena: datos.contrasena.trim(),
    rol: "CLIENTE",
    activo: true,
    telefono: (datos.telefono || "").trim(),
    comuna: (datos.comuna || "").trim(),
    direccion: (datos.direccion || "").trim()
  };

  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify([...registrados, nueva]));

  // Si ese correo se habia eliminado antes, puede volver a usarse
  const eliminadas = leerEliminadas().filter((correo) => correo !== nueva.correo);
  localStorage.setItem(CLAVE_ELIMINADAS, JSON.stringify(eliminadas));

  return nueva;
}

// LEER: la cuenta completa de un correo, o null
export function buscarUsuario(correo) {
  const limpio = correo.trim().toLowerCase();
  return leerUsuarios().find((cuenta) => cuenta.correo.toLowerCase() === limpio) || null;
}

// ACTUALIZAR: cambia los datos de una cuenta. El correo no se puede cambiar.
// Si es una cuenta base, se guarda una copia editada, que tiene prioridad
// sobre la original.
export function actualizarCuenta(correo, cambios) {
  const actual = buscarUsuario(correo);

  if (!actual) {
    return null;
  }

  const editada = { ...actual, ...cambios, correo: actual.correo, rol: actual.rol };

  const otros = leerRegistrados().filter((cuenta) =>
    cuenta.correo.toLowerCase() !== actual.correo.toLowerCase()
  );

  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify([...otros, editada]));

  return editada;
}

// ELIMINAR: borra la cuenta. Si era una cuenta base, anota su correo
// para que no vuelva a aparecer.
export function eliminarCuenta(correo) {
  const limpio = correo.trim().toLowerCase();

  const quedan = leerRegistrados().filter((cuenta) => cuenta.correo.toLowerCase() !== limpio);
  localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(quedan));

  const eliminadas = leerEliminadas();
  if (!eliminadas.includes(limpio)) {
    localStorage.setItem(CLAVE_ELIMINADAS, JSON.stringify([...eliminadas, limpio]));
  }
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

// Panel de trabajo de cada rol. Los clientes no tienen panel: siguen en la tienda.
// Cuando existan los paneles de la despachadora y del repartidor,
// se agregan aqui sus rutas y el login los llevara solos.
export const PANELES = {
  ADMINISTRADOR: "/admin"
};

// Devuelve la ruta del panel del rol, o null si no tiene
export function panelDeRol(rol) {
  return PANELES[rol] || null;
}
