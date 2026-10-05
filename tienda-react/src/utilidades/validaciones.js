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
