export const CLAVE_USUARIOS = "usuariosSistema"
export const CLAVE_SESION = "usuarioActivo"

// Las cuentas base estan escritas en el codigo.
export const CLAVE_ELIMINADAS = "cuentasEliminadas"

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
    correo: "camila@gmail.com",
    contrasena: "Clien1234",
    rol: "CLIENTE"
  }
]

// =========================================
// AYUDANTES
// =========================================

function limpiarCorreo(correo) {
  return String(correo || "")
      .trim()
      .toLowerCase()
}

function esCuentaBase(correo) {
  const limpio = limpiarCorreo(correo)

  return USUARIOS_BASE.some(
      (usuario) =>
          limpiarCorreo(usuario.correo) === limpio
  )
}

/*
 * Todo el sistema trabaja con el nombre completo
 * dentro de la propiedad "nombre".
 *
 * Ejemplo:
 * nombre = "Camila"
 * apellidos = "Rojas"
 *
 * Resultado:
 * nombre = "Camila Rojas"
 */
function construirNombreCompleto(nombre, apellidos = "") {
  const nombreLimpio = String(nombre || "").trim()
  const apellidosLimpios = String(apellidos || "").trim()

  if (apellidosLimpios === "") {
    return nombreLimpio
  }

  /*
   * Evita terminar con algo como:
   * "Camila Rojas Rojas"
   * si el nombre ya venía completo.
   */
  if (
      nombreLimpio
          .toLowerCase()
          .endsWith(apellidosLimpios.toLowerCase())
  ) {
    return nombreLimpio
  }

  return `${nombreLimpio} ${apellidosLimpios}`.trim()
}

/*
 * Corrige cuentas antiguas creadas por el panel
 * que guardaban:
 *
 * nombre: "Camila"
 * apellidos: "Rojas"
 *
 * Ahora quedan:
 *
 * nombre: "Camila Rojas"
 *
 * El resto del sitio ya trabaja de esta forma.
 */
function normalizarUsuario(usuario) {
  const copia = { ...usuario }

  if (copia.apellidos) {
    copia.nombre = construirNombreCompleto(
        copia.nombre,
        copia.apellidos
    )

    delete copia.apellidos
  }

  copia.correo = limpiarCorreo(copia.correo)

  return copia
}

// =========================================
// PERSISTENCIA
// =========================================

function leerRegistrados() {
  try {
    const guardado =
        localStorage.getItem(CLAVE_USUARIOS)

    const lista =
        guardado
            ? JSON.parse(guardado)
            : []

    if (!Array.isArray(lista)) {
      return []
    }

    return lista.map(normalizarUsuario)
  } catch {
    return []
  }
}

function guardarRegistrados(usuarios) {
  localStorage.setItem(
      CLAVE_USUARIOS,
      JSON.stringify(
          usuarios.map(normalizarUsuario)
      )
  )
}

function leerEliminadas() {
  try {
    const guardado =
        localStorage.getItem(CLAVE_ELIMINADAS)

    const lista =
        guardado
            ? JSON.parse(guardado)
            : []

    return Array.isArray(lista)
        ? lista.map(limpiarCorreo)
        : []
  } catch {
    return []
  }
}

function guardarEliminadas(correos) {
  const lista = [
    ...new Set(
        correos.map(limpiarCorreo)
    )
  ]

  localStorage.setItem(
      CLAVE_ELIMINADAS,
      JSON.stringify(lista)
  )
}

// =========================================
// LEER USUARIOS
// =========================================

export function leerUsuarios() {
  const registrados = leerRegistrados()
  const eliminadas = leerEliminadas()

  const base = USUARIOS_BASE
      .map(normalizarUsuario)
      .filter((cuenta) => {
        const correoBase =
            limpiarCorreo(cuenta.correo)

        const existeRegistrado =
            registrados.some(
                (registrado) =>
                    limpiarCorreo(
                        registrado.correo
                    ) === correoBase
            )

        const estaEliminada =
            eliminadas.includes(correoBase)

        return (
            !existeRegistrado &&
            !estaEliminada
        )
      })

  return [
    ...registrados,
    ...base
  ]
}

// =========================================
// LOGIN
// =========================================

export function buscarCuenta(
    correo,
    contrasena
) {
  const limpio =
      limpiarCorreo(correo)

  return (
      leerUsuarios().find(
          (cuenta) =>
              limpiarCorreo(
                  cuenta.correo
              ) === limpio &&
              cuenta.contrasena ===
              contrasena.trim()
      ) || null
  )
}

// =========================================
// CORREO REGISTRADO
// =========================================

export function correoRegistrado(correo) {
  const limpio =
      limpiarCorreo(correo)

  return leerUsuarios().some(
      (cuenta) =>
          limpiarCorreo(
              cuenta.correo
          ) === limpio
  )
}

// =========================================
// REGISTRAR CLIENTE
// =========================================

export function registrarCliente(datos) {
  const registrados =
      leerRegistrados()

  const nueva = {
    nombre: construirNombreCompleto(
        datos.nombre,
        datos.apellidos
    ),

    correo:
        limpiarCorreo(datos.correo),

    contrasena:
        datos.contrasena.trim(),

    rol: "CLIENTE",

    activo: true,

    telefono:
        (datos.telefono || "").trim(),

    comuna:
        (datos.comuna || "").trim(),

    direccion:
        (datos.direccion || "").trim()
  }

  guardarRegistrados([
    ...registrados,
    nueva
  ])

  /*
   * Si había sido eliminada anteriormente,
   * permitimos volver a registrar el correo.
   */
  const eliminadas =
      leerEliminadas().filter(
          (correo) =>
              correo !== nueva.correo
      )

  guardarEliminadas(eliminadas)

  return nueva
}

// =========================================
// BUSCAR USUARIO
// =========================================

export function buscarUsuario(correo) {
  const limpio =
      limpiarCorreo(correo)

  return (
      leerUsuarios().find(
          (cuenta) =>
              limpiarCorreo(
                  cuenta.correo
              ) === limpio
      ) || null
  )
}

// =========================================
// ACTUALIZAR CUENTA NORMAL
// Perfil del cliente
// =========================================

export function actualizarCuenta(
    correo,
    cambios
) {
  const actual =
      buscarUsuario(correo)

  if (!actual) {
    return null
  }

  const editada = normalizarUsuario({
    ...actual,
    ...cambios,

    // Desde el perfil no se cambia
    // ni correo ni rol.
    correo: actual.correo,
    rol: actual.rol
  })

  const otros =
      leerRegistrados().filter(
          (cuenta) =>
              limpiarCorreo(
                  cuenta.correo
              ) !==
              limpiarCorreo(
                  actual.correo
              )
      )

  guardarRegistrados([
    ...otros,
    editada
  ])

  return editada
}

// =========================================
// ELIMINAR
// =========================================

export function eliminarCuenta(correo) {
  const limpio =
      limpiarCorreo(correo)

  const quedan =
      leerRegistrados().filter(
          (cuenta) =>
              limpiarCorreo(
                  cuenta.correo
              ) !== limpio
      )

  guardarRegistrados(quedan)

  const eliminadas =
      leerEliminadas()

  if (!eliminadas.includes(limpio)) {
    guardarEliminadas([
      ...eliminadas,
      limpio
    ])
  }
}

// =========================================
// CREAR USUARIO DESDE ADMIN
// =========================================

export function crearUsuario(datos) {
  const registrados =
      leerRegistrados()

  const correo =
      limpiarCorreo(datos.correo)

  if (correoRegistrado(correo)) {
    return {
      ok: false,
      mensaje:
          "Ya existe un usuario con ese correo."
    }
  }

  const nuevo = {
    run:
        (datos.run || "")
            .trim()
            .toUpperCase(),

    /*
     * IMPORTANTE:
     * guardamos nombre completo.
     */
    nombre:
        construirNombreCompleto(
            datos.nombre,
            datos.apellidos
        ),

    nacimiento:
        datos.nacimiento || "",

    region:
        datos.region || "",

    comuna:
        datos.comuna || "",

    direccion:
        (datos.direccion || "").trim(),

    correo,

    contrasena:
        datos.contrasena.trim(),

    rol:
    datos.rol,

    activo: true
  }

  guardarRegistrados([
    ...registrados,
    nuevo
  ])

  const eliminadas =
      leerEliminadas().filter(
          (correoEliminado) =>
              correoEliminado !== correo
      )

  guardarEliminadas(eliminadas)

  return {
    ok: true,
    usuario: nuevo
  }
}

// =========================================
// ACTUALIZAR DESDE ADMIN
// =========================================

export function actualizarUsuarioAdmin(
    correoOriginal,
    cambios
) {
  const actual =
      buscarUsuario(correoOriginal)

  if (!actual) {
    return {
      ok: false,
      mensaje:
          "No se encontró el usuario."
    }
  }

  const correoAnterior =
      limpiarCorreo(
          actual.correo
      )

  const correoSolicitado =
      cambios.correo
          ? limpiarCorreo(
              cambios.correo
          )
          : correoAnterior

  const rolSolicitado =
      cambios.rol ||
      actual.rol

  // =====================================
  // PROTEGER AL ADMINISTRADOR ACTUAL
  // =====================================

  const sesion =
      leerSesion()

  const esUsuarioActual =
      sesion &&
      limpiarCorreo(
          sesion.correo
      ) === correoAnterior

  if (esUsuarioActual) {
    if (
        correoSolicitado !==
        correoAnterior
    ) {
      return {
        ok: false,
        mensaje:
            "No puedes cambiar el correo de tu propia cuenta."
      }
    }

    if (
        rolSolicitado !==
        actual.rol
    ) {
      return {
        ok: false,
        mensaje:
            "No puedes cambiar el rol de tu propia cuenta."
      }
    }
  }

  // =====================================
  // EVITAR CORREO DUPLICADO
  // =====================================

  const repetido =
      leerUsuarios().some(
          (usuario) =>
              limpiarCorreo(
                  usuario.correo
              ) ===
              correoSolicitado &&
              limpiarCorreo(
                  usuario.correo
              ) !==
              correoAnterior
      )

  if (repetido) {
    return {
      ok: false,
      mensaje:
          "Ya existe un usuario con ese correo."
    }
  }

  // =====================================
  // NOMBRE COMPLETO
  // =====================================

  let nombreNuevo =
      actual.nombre

  if (
      cambios.nombre !== undefined ||
      cambios.apellidos !== undefined
  ) {
    nombreNuevo =
        construirNombreCompleto(
            cambios.nombre ??
            actual.nombre,

            cambios.apellidos ??
            ""
        )
  }

  // =====================================
  // CREAR VERSIÓN EDITADA
  // =====================================

  const editado = normalizarUsuario({
    ...actual,
    ...cambios,

    nombre:
    nombreNuevo,

    correo:
    correoSolicitado,

    rol:
    rolSolicitado
  })

  /*
   * Si deja contraseña vacía,
   * mantenemos la anterior.
   */
  if (!cambios.contrasena) {
    editado.contrasena =
        actual.contrasena
  }

  /*
   * Nunca guardamos "apellidos"
   * como propiedad separada.
   */
  delete editado.apellidos

  const otros =
      leerRegistrados().filter(
          (usuario) =>
              limpiarCorreo(
                  usuario.correo
              ) !==
              correoAnterior
      )

  guardarRegistrados([
    ...otros,
    editado
  ])

  // =====================================
  // CUENTA BASE + CAMBIO DE CORREO
  // =====================================

  /*
   * Este era uno de los errores importantes.
   *
   * Si "admin@gaselvolcan.cl" o cualquier
   * cuenta base cambia de correo, la cuenta
   * base original volvería a aparecer.
   *
   * Por eso marcamos el correo original
   * como eliminado.
   */
  if (
      correoSolicitado !==
      correoAnterior &&
      esCuentaBase(
          correoAnterior
      )
  ) {
    const eliminadas =
        leerEliminadas()

    if (
        !eliminadas.includes(
            correoAnterior
        )
    ) {
      guardarEliminadas([
        ...eliminadas,
        correoAnterior
      ])
    }
  }

  /*
   * Si el nuevo correo estaba marcado
   * como eliminado anteriormente,
   * lo habilitamos de nuevo.
   */
  const eliminadasActualizadas =
      leerEliminadas().filter(
          (correo) =>
              correo !==
              correoSolicitado
      )

  guardarEliminadas(
      eliminadasActualizadas
  )

  return {
    ok: true,
    usuario: editado
  }
}

// =========================================
// ACTIVAR / DESACTIVAR
// =========================================

export function cambiarEstadoUsuario(
    correo
) {
  const usuario =
      buscarUsuario(correo)

  if (!usuario) {
    return null
  }

  /*
   * También protegemos aquí la sesión
   * actual, aunque la interfaz ya lo
   * compruebe.
   */
  const sesion =
      leerSesion()

  if (
      sesion &&
      limpiarCorreo(
          sesion.correo
      ) ===
      limpiarCorreo(
          usuario.correo
      )
  ) {
    return null
  }

  return actualizarCuenta(
      correo,
      {
        activo:
            usuario.activo === false
      }
  )
}

// =========================================
// SESIÓN
// =========================================

export function leerSesion() {
  try {
    const guardado =
        localStorage.getItem(
            CLAVE_SESION
        )

    return guardado
        ? JSON.parse(guardado)
        : null
  } catch {
    return null
  }
}

export function guardarSesion(usuario) {
  if (usuario) {
    localStorage.setItem(
        CLAVE_SESION,
        JSON.stringify(usuario)
    )
  } else {
    localStorage.removeItem(
        CLAVE_SESION
    )
  }
}

// =========================================
// INICIALES
// =========================================

// "Camila Rojas" -> "CR"
export function iniciales(nombre) {
  const partes =
      String(nombre)
          .trim()
          .split(/\s+/)

  if (partes.length === 1) {
    return partes[0]
        .slice(0, 2)
        .toUpperCase()
  }

  return (
      partes[0][0] +
      partes[1][0]
  ).toUpperCase()
}

// =========================================
// NOMBRE DE ROL
// =========================================

export function nombreDeRol(rol) {
  const nombres = {
    ADMINISTRADOR:
        "Administrador",

    DESPACHADORA:
        "Despachadora",

    REPARTIDOR:
        "Repartidor"
  }

  return nombres[rol] || "Cliente"
}

// =========================================
// PANELES POR ROL
// =========================================

export const PANELES = {
  ADMINISTRADOR: "/admin"
}

export function panelDeRol(rol) {
  return PANELES[rol] || null
}