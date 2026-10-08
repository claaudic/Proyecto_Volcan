// Reglas de validacion de los formularios.
// Son funciones puras: reciben un texto y devuelven el mensaje de error,
// o un texto vacio si el valor es correcto. No dependen de React,
// por eso se pueden probar solas con Jasmine.
//
// Las reglas vienen del Anexo 1 de la evaluacion y son las mismas
// que usaba el sitio en HTML (js/contacto.js y js/sesion.js).

export const DOMINIOS_PERMITIDOS = [
  "@gaselvolcan.cl",
  "@duoc.cl",
  "@profesor.duoc.cl",
  "@gmail.com"
];

export function validarNombre(valor) {
  const nombre = valor.trim();

  if (nombre === "") {
    return "Escribe tu nombre.";
  }

  if (nombre.length > 100) {
    return "El nombre no puede superar los 100 caracteres.";
  }

  return "";
}

export function validarCorreo(valor) {
  const correo = valor.trim().toLowerCase();

  if (correo === "") {
    return "Ingresa tu correo electrónico.";
  }

  if (correo.length > 100) {
    return "El correo no puede superar los 100 caracteres.";
  }

  const dominioValido = DOMINIOS_PERMITIDOS.some((dominio) =>
    correo.endsWith(dominio)
  );

  if (!dominioValido) {
    return "Usa un correo @gaselvolcan.cl si eres del equipo, o @gmail.com si eres cliente.";
  }

  return "";
}

export function validarContrasena(valor) {
  const contrasena = valor.trim();

  if (contrasena === "") {
    return "Ingresa tu contraseña.";
  }

  if (contrasena.length < 4) {
    return "La contraseña debe tener al menos 4 caracteres.";
  }

  if (contrasena.length > 10) {
    return "La contraseña no puede superar los 10 caracteres.";
  }

  return "";
}

export function validarComentario(valor) {
  const comentario = valor.trim();

  if (comentario === "") {
    return "Escribe tu mensaje.";
  }

  if (comentario.length > 500) {
    return "El mensaje no puede superar los 500 caracteres.";
  }

  return "";
}

// ---------- Registro de clientes (las mismas reglas de js/registro.js) ----------

// Texto obligatorio con largo maximo: sirve para nombre y apellidos
export function validarTexto(valor, maximo, mensajeVacio) {
  const texto = valor.trim();

  if (texto === "") {
    return mensajeVacio;
  }

  if (texto.length > maximo) {
    return "No puede superar los " + maximo + " caracteres.";
  }

  return "";
}

// Como validarCorreo, pero las cuentas del equipo no se crean desde la tienda
export function validarCorreoCliente(valor) {
  const correo = valor.trim().toLowerCase();

  if (correo.endsWith("@gaselvolcan.cl")) {
    return "Las cuentas del equipo las crea el administrador. Si trabajas en Gas El Volcán, pide tu acceso.";
  }

  const error = validarCorreo(valor);

  if (error && correo !== "" && correo.length <= 100) {
    return "Usa un correo @duoc.cl, @profesor.duoc.cl o @gmail.com.";
  }

  return error;
}

export function validarRepeticion(contrasena, repetida) {
  if (repetida.trim() === "") {
    return "Repite la contraseña.";
  }

  if (repetida.trim() !== contrasena.trim()) {
    return "Las contraseñas no coinciden.";
  }

  return "";
}

// El telefono es opcional: vacio es valido
export function validarTelefono(valor) {
  const telefono = valor.trim();

  if (telefono === "") {
    return "";
  }

  if (!/^[+0-9\s]{8,15}$/.test(telefono)) {
    return "Usa solo números, espacios y el signo +.";
  }

  return "";
}

// Direccion de despacho: calle y numero. Debe tener al menos una letra
// y un numero, entre 5 y 300 caracteres ("Libertad 123" si, "abcde" no).
// No comprueba que la calle exista: eso necesitaria una API de direcciones.
export function validarDireccion(valor) {
  const texto = valor.trim();

  if (texto === "") {
    return "Ingresa tu dirección de despacho.";
  }

  if (texto.length > 300) {
    return "No puede superar los 300 caracteres.";
  }

  if (texto.length < 5 || !/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(texto) || !/\d/.test(texto)) {
    return "Escribe la calle y el número, por ejemplo: Libertad 123.";
  }

  return "";
}

// Telefono obligatorio (en el checkout, para coordinar el despacho)
export function validarTelefonoObligatorio(valor) {
  if (valor.trim() === "") {
    return "Ingresa un teléfono de contacto.";
  }

  return validarTelefono(valor);
}
