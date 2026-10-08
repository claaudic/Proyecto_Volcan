// Pasarela de pago simulada.
// No se conecta a ningun banco: valida la tarjeta y responde segun reglas
// fijas, como las tarjetas de prueba de las pasarelas reales.
// En la EP3, con backend, "procesarPago" se reemplaza por la API real.
//
// Seguridad: el numero completo y el CVV nunca se guardan.
// Al pedido solo pasan los ultimos 4 digitos.

// Tarjetas de prueba que el "banco" rechaza, con su motivo.
// Cualquier otra tarjeta valida se aprueba (por ejemplo 4111 1111 1111 1111).
export const TARJETAS_RECHAZADAS = {
  "4000000000009995": "Fondos insuficientes.",
  "4000000000000002": "El banco rechazó la tarjeta."
};

// "4111 1111-1111" -> "41111111111"
export function soloDigitos(texto) {
  return String(texto).replace(/\D/g, "");
}

// Algoritmo de Luhn: la formula que usan todas las tarjetas para
// detectar numeros mal escritos. Desde la derecha, se duplica un digito
// si y otro no; si el doble pasa de 9 se le resta 9. La suma debe
// terminar en 0.
export function pasaLuhn(numero) {
  const digitos = soloDigitos(numero);
  let suma = 0;

  for (let i = 0; i < digitos.length; i++) {
    let digito = Number(digitos[digitos.length - 1 - i]);

    if (i % 2 === 1) {
      digito = digito * 2;
      if (digito > 9) {
        digito = digito - 9;
      }
    }

    suma = suma + digito;
  }

  return digitos.length > 0 && suma % 10 === 0;
}

export function validarNumeroTarjeta(numero) {
  const texto = String(numero).trim();

  if (texto === "") {
    return "Ingresa el número de la tarjeta.";
  }

  // Se aceptan espacios y guiones para separar, pero nada mas
  if (/[^\d\s-]/.test(texto) || soloDigitos(texto).length !== 16) {
    return "El número debe tener 16 dígitos.";
  }

  if (!pasaLuhn(texto)) {
    return "El número de la tarjeta no es válido. Revisa que esté bien escrito.";
  }

  return "";
}

export function validarTitular(titular) {
  const texto = String(titular).trim();

  if (texto === "") {
    return "Ingresa el nombre que aparece en la tarjeta.";
  }

  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(texto)) {
    return "El nombre solo puede tener letras.";
  }

  if (texto.length > 50) {
    return "El nombre no puede superar los 50 caracteres.";
  }

  return "";
}

// Formato MM/AA. La tarjeta sirve hasta el ultimo dia de ese mes.
// "hoy" se puede pasar para las pruebas.
export function validarVencimiento(vencimiento, hoy = new Date()) {
  const texto = String(vencimiento).trim();
  const partes = /^(\d{2})\/(\d{2})$/.exec(texto);

  if (texto === "") {
    return "Ingresa la fecha de vencimiento.";
  }

  if (!partes || Number(partes[1]) < 1 || Number(partes[1]) > 12) {
    return "Usa el formato MM/AA, por ejemplo 08/28.";
  }

  const mes = Number(partes[1]);
  const anio = 2000 + Number(partes[2]);
  const mesActual = hoy.getFullYear() * 12 + hoy.getMonth() + 1;

  if (anio * 12 + mes < mesActual) {
    return "La tarjeta está vencida.";
  }

  return "";
}

export function validarCvv(cvv) {
  const texto = String(cvv).trim();

  if (texto === "") {
    return "Ingresa el código de seguridad.";
  }

  if (!/^\d{3}$/.test(texto)) {
    return "El código de seguridad tiene 3 dígitos.";
  }

  return "";
}

// El "banco" responde: { aprobado: true } o { aprobado: false, motivo }
export function procesarPago(numero) {
  const motivo = TARJETAS_RECHAZADAS[soloDigitos(numero)];

  if (motivo) {
    return { aprobado: false, motivo };
  }

  return { aprobado: true, motivo: "" };
}

// Lo unico que se guarda de la tarjeta
export function ultimosCuatro(numero) {
  return soloDigitos(numero).slice(-4);
}
