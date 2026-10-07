// Ayudas para los formularios, compartidas por Contacto, Login y Registro.

// Borde verde o rojo del campo, segun si tiene error.
// Si el campo esta vacio no se pinta, para no marcar en rojo lo que
// la persona todavia no ha alcanzado a escribir.
export function claseCampo(valor, error) {
  if (valor.trim() === "") {
    return "";
  }

  return error ? "campo-invalido" : "campo-valido";
}
