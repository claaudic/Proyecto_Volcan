const formContacto = document.getElementById("formContacto");

if (formContacto) {
    const campoNombre = document.getElementById("nombre");
    const campoCorreo = document.getElementById("correoContacto");
    const campoComentario = document.getElementById("comentario");
    const errorNombre = document.getElementById("errorNombre");
    const errorCorreo = document.getElementById("errorCorreoContacto");
    const errorComentario = document.getElementById("errorComentario");
    const contador = document.getElementById("contadorComentario");
    const exito = document.getElementById("mensajeExito");

    function validarNombre(valor) {
        const nombre = valor.trim();

        if (nombre === "") {
            return "Escribe tu nombre.";
        }

        if (nombre.length > 100) {
            return "El nombre no puede superar los 100 caracteres.";
        }

        return "";
    }

    function validarComentario(valor) {
        const comentario = valor.trim();

        if (comentario === "") {
            return "Escribe tu mensaje.";
        }

        if (comentario.length > 500) {
            return "El mensaje no puede superar los 500 caracteres.";
        }

        return "";
    }

    function pintar(campo, contenedor, mensaje) {
        contenedor.textContent = mensaje;

        if (campo.value.trim() === "") {
            campo.classList.remove("campo-valido", "campo-invalido");
            return;
        }

        if (mensaje === "") {
            campo.classList.add("campo-valido");
            campo.classList.remove("campo-invalido");
        } else {
            campo.classList.add("campo-invalido");
            campo.classList.remove("campo-valido");
        }
    }

    function actualizarContador() {
        const usados = campoComentario.value.length;
        contador.textContent = usados + " / 500";

        if (usados > 450) {
            contador.classList.add("contador-alerta");
        } else {
            contador.classList.remove("contador-alerta");
        }
    }

    campoNombre.addEventListener("input", function () {
        ocultarExito();
        pintar(campoNombre, errorNombre, validarNombre(campoNombre.value));
    });

    campoCorreo.addEventListener("input", function () {
        ocultarExito();
        pintar(campoCorreo, errorCorreo, validarCorreo(campoCorreo.value));
    });

    campoComentario.addEventListener("input", function () {
        ocultarExito();
        actualizarContador();
        pintar(campoComentario, errorComentario, validarComentario(campoComentario.value));
    });

    formContacto.addEventListener("submit", function (evento) {
        evento.preventDefault();
        ocultarExito();

        const fallaNombre = validarNombre(campoNombre.value);
        const fallaCorreo = validarCorreo(campoCorreo.value);
        const fallaComentario = validarComentario(campoComentario.value);

        pintar(campoNombre, errorNombre, fallaNombre);
        pintar(campoCorreo, errorCorreo, fallaCorreo);
        pintar(campoComentario, errorComentario, fallaComentario);

        if (fallaNombre !== "") {
            campoNombre.focus();
            return;
        }

        if (fallaCorreo !== "") {
            campoCorreo.focus();
            return;
        }

        if (fallaComentario !== "") {
            campoComentario.focus();
            return;
        }

        const nombre = campoNombre.value.trim().split(" ")[0];
        exito.textContent = "Gracias " + nombre + ", recibimos tu mensaje. Te respondemos dentro de las próximas horas hábiles.";
        exito.classList.remove("d-none");

        formContacto.reset();
        actualizarContador();

        [campoNombre, campoCorreo, campoComentario].forEach(function (campo) {
            campo.classList.remove("campo-valido", "campo-invalido");
        });

        errorNombre.textContent = "";
        errorCorreo.textContent = "";
        errorComentario.textContent = "";
        exito.scrollIntoView({ block: "nearest" });
    });

    function ocultarExito() {
        exito.classList.add("d-none");
        exito.textContent = "";
    }

    actualizarContador();
}
