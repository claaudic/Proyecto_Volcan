// Productos vistos recientemente.
// Se guardan solo los codigos en localStorage, como el carrito:
// el resto de los datos se busca en el catalogo al mostrarlos.

export const CLAVE_VISTOS = "productosVistos";
export const MAXIMO_VISTOS = 4;

// Lista de codigos, el mas reciente primero (vacia si no hay o esta danada)
export function leerVistos() {
  try {
    const guardado = localStorage.getItem(CLAVE_VISTOS);
    const lista = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

// Pone el codigo al comienzo, sin repetirlo, y deja solo los ultimos 4
export function registrarVisto(codigo) {
  const sinRepetir = leerVistos().filter((c) => c !== codigo);
  const nueva = [codigo, ...sinRepetir].slice(0, MAXIMO_VISTOS);

  try {
    localStorage.setItem(CLAVE_VISTOS, JSON.stringify(nueva));
  } catch {
    // Si el navegador no deja guardar, la tienda sigue funcionando igual
  }

  return nueva;
}
