// Zonas de reparto de la distribuidora.
// Los mismos datos de js/zonas.js del sitio en HTML.
// Las usan el registro (para avisar si llegamos) y el buscador de Nosotros.
export const COMUNAS_COBERTURA = [
  "Chillán",
  "Chillán Viejo",
  "El Carmen",
  "Pinto",
  "San Ignacio",
  "Bulnes",
  "Quillón"
];
export const ZONAS = [
  {
    zona: "Zona Centro",
    comunas: ["chillan"],
    etiqueta: "Chillán",
    dias: "Lunes a sábado",
    horario: "08:00 – 20:00",
    entrega: "1 – 3 horas"
  },
  {
    zona: "Zona Oriente",
    comunas: ["chillan viejo"],
    etiqueta: "Chillán Viejo",
    dias: "Lunes a viernes",
    horario: "08:00 – 18:00",
    entrega: "2 – 4 horas"
  },
  {
    zona: "Zona Rural",
    comunas: ["el carmen", "carmen", "pinto", "san ignacio"],
    etiqueta: "El Carmen, Pinto y San Ignacio",
    dias: "Martes y jueves",
    horario: "08:00 – 16:00",
    entrega: "3 – 6 horas"
  },
  {
    zona: "Zona Sur",
    comunas: ["bulnes", "quillon"],
    etiqueta: "Bulnes y Quillón",
    dias: "Miércoles",
    horario: "08:00 – 16:00",
    entrega: "4 – 6 horas"
  }
];

// "Chillán" -> "chillan": sin mayusculas, sin tildes y sin espacios de sobra
export function normalizar(texto) {
  return String(texto)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Devuelve la zona que reparte en esa comuna, o null si no llegamos
export function buscarZona(comuna) {
  const clave = normalizar(comuna);

  if (clave === "") {
    return null;
  }

  return ZONAS.find((zona) => zona.comunas.includes(clave)) || null;
}
