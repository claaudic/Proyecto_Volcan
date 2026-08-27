const ZONAS_COBERTURA = [
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

function normalizar(texto) {
    return texto
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

function buscarZona(comuna) {
    const clave = normalizar(comuna);

    if (clave === "") {
        return null;
    }

    return ZONAS_COBERTURA.find(function (zona) {
        return zona.comunas.some(function (nombre) {
            return nombre === clave || nombre.indexOf(clave) === 0;
        });
    });
}

const formCobertura = document.getElementById("formCobertura");

if (formCobertura) {
    const campoComuna = document.getElementById("comuna");
    const resultado = document.getElementById("resultadoCobertura");

    formCobertura.addEventListener("submit", function (evento) {
        evento.preventDefault();
        mostrarResultado(campoComuna.value);
    });

    campoComuna.addEventListener("input", function () {
        if (campoComuna.value.trim() === "") {
            resultado.className = "resultado-cobertura d-none";
            resultado.innerHTML = "";
        }
    });

    function mostrarResultado(valor) {
        if (valor.trim() === "") {
            resultado.className = "resultado-cobertura resultado-sin d-none";
            return;
        }

        const zona = buscarZona(valor);

        if (!zona) {
            resultado.className = "resultado-cobertura resultado-sin";
            resultado.innerHTML =
                '<p class="resultado-titulo">Todavía no llegamos ahí</p>' +
                '<p class="resultado-texto">No tenemos reparto en esa comuna. ' +
                'Escríbenos por <a href="contacto.html">Contacto</a> y lo revisamos.</p>';
            return;
        }

        resultado.className = "resultado-cobertura resultado-si";
        resultado.innerHTML =
            '<p class="resultado-titulo">Sí, llegamos a ' + zona.etiqueta + '</p>' +
            '<ul class="resultado-datos">' +
            '<li><span>Zona</span><strong>' + zona.zona + '</strong></li>' +
            '<li><span>Días</span><strong>' + zona.dias + '</strong></li>' +
            '<li><span>Horario</span><strong>' + zona.horario + '</strong></li>' +
            '<li><span>Entrega</span><strong>' + zona.entrega + '</strong></li>' +
            '</ul>';
    }
}
