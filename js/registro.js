const formRegistro = document.getElementById("formRegistro");

const campoNombre = document.getElementById("regNombre");
const campoApellidos = document.getElementById("regApellidos");
const campoCorreo = document.getElementById("regCorreo");
const campoContrasena = document.getElementById("regContrasena");
const campoRepetir = document.getElementById("regRepetir");
const campoTelefono = document.getElementById("regTelefono");
const campoComuna = document.getElementById("regComuna");
const campoDireccion = document.getElementById("regDireccion");

const errorNombreReg = document.getElementById("errorRegNombre");
const errorApellidosReg = document.getElementById("errorRegApellidos");
const errorCorreoReg = document.getElementById("errorRegCorreo");
const errorContrasenaReg = document.getElementById("errorRegContrasena");
const errorRepetirReg = document.getElementById("errorRegRepetir");
const errorTelefonoReg = document.getElementById("errorRegTelefono");
const errorDireccionReg = document.getElementById("errorRegDireccion");

const avisoComunaReg = document.getElementById("avisoRegComuna");
const mensajeRegistro = document.getElementById("mensajeRegistro");
const botonVerContrasena = document.getElementById("mostrarRegContrasena");


botonVerContrasena.addEventListener("click", function () {
    if (campoContrasena.type === "password") {
        campoContrasena.type = "text";
        botonVerContrasena.textContent = "Ocultar";
    } else {
        campoContrasena.type = "password";
        botonVerContrasena.textContent = "Mostrar";
    }
});


// ==========================================
// VALIDACIONES
// ==========================================

function validarTextoRegistro(valor, maximo, etiqueta) {
    const texto = valor.trim();

    if (texto === "") {
        return "Ingresa " + etiqueta + ".";
    }

    if (texto.length > maximo) {
        return "No puede superar los " + maximo + " caracteres.";
    }

    return "";
}


const DOMINIO_DEL_EQUIPO = "@gaselvolcan.cl";


function dominiosDeCliente() {
    return DOMINIOS_PERMITIDOS.filter(function (dominio) {
        return dominio !== DOMINIO_DEL_EQUIPO;
    });
}


function validarCorreoRegistro(valor) {
    const correo = valor.trim().toLowerCase();

    if (correo === "") {
        return "Ingresa tu correo electrónico.";
    }

    if (correo.length > 100) {
        return "El correo no puede superar los 100 caracteres.";
    }

    if (correo.endsWith(DOMINIO_DEL_EQUIPO)) {
        return "Las cuentas del equipo las crea el administrador. Si trabajas en Gas El Volcán, pide tu acceso.";
    }

    const permitidos = dominiosDeCliente();

    const dominioValido = permitidos.some(function (dominio) {
        return correo.endsWith(dominio);
    });

    if (!dominioValido) {
        return "Usa un correo " + permitidos.join(", ") + ".";
    }

    return "";
}


function validarTelefonoRegistro(valor) {
    const telefono = valor.trim();

    if (telefono === "") {
        return "";
    }

    if (!/^[+0-9\s]{8,15}$/.test(telefono)) {
        return "Usa solo números, espacios y el signo +.";
    }

    return "";
}


function validarRepeticion() {
    if (campoRepetir.value.trim() === "") {
        return "Repite la contraseña.";
    }

    if (campoRepetir.value.trim() !== campoContrasena.value.trim()) {
        return "Las contraseñas no coinciden.";
    }

    return "";
}


function correoYaRegistrado(correo) {
    const guardados = localStorage.getItem("usuariosSistema");

    let usuarios = [];

    if (guardados) {
        try {
            const lista = JSON.parse(guardados);

            if (Array.isArray(lista)) {
                usuarios = lista;
            }
        } catch (error) {
            usuarios = [];
        }
    }

    const enGuardados = usuarios.some(function (usuario) {
        return String(usuario.correo).toLowerCase() === correo;
    });

    const enBase = USUARIOS.some(function (usuario) {
        return usuario.correo.toLowerCase() === correo && !cuentaEliminada(correo);
    });

    return enGuardados || enBase;
}


// ==========================================
// PINTAR EL ESTADO DE CADA CAMPO
// ==========================================

function pintarCampo(campo, contenedor, mensaje) {
    if (contenedor) {
        contenedor.textContent = mensaje;
    }

    if (campo.value.trim() === "") {
        campo.classList.remove("campo-valido", "campo-invalido");
        return;
    }

    campo.classList.toggle("campo-valido", mensaje === "");
    campo.classList.toggle("campo-invalido", mensaje !== "");
}


function ocultarMensajeRegistro() {
    mensajeRegistro.classList.add("d-none");
    mensajeRegistro.textContent = "";
}


function mostrarMensajeRegistro(texto) {
    mensajeRegistro.textContent = texto;
    mensajeRegistro.classList.remove("d-none");
}


function revisarComunaRegistro() {
    const valor = campoComuna.value.trim();

    if (valor === "" || typeof buscarZona !== "function") {
        avisoComunaReg.textContent = "";
        avisoComunaReg.className = "mensaje-ayuda";
        return;
    }

    const zona = buscarZona(valor);

    if (zona) {
        avisoComunaReg.textContent = "Llegamos a tu comuna: " + zona.zona + ".";
        avisoComunaReg.className = "mensaje-ayuda aviso-cobertura-ok";
    } else {
        avisoComunaReg.textContent = "Todavía no tenemos reparto en esa comuna.";
        avisoComunaReg.className = "mensaje-ayuda aviso-cobertura-no";
    }
}


// ==========================================
// VALIDACION EN VIVO
// ==========================================

campoNombre.addEventListener("input", function () {
    ocultarMensajeRegistro();
    pintarCampo(campoNombre, errorNombreReg,
        validarTextoRegistro(campoNombre.value, 50, "tu nombre"));
});

campoApellidos.addEventListener("input", function () {
    ocultarMensajeRegistro();
    pintarCampo(campoApellidos, errorApellidosReg,
        validarTextoRegistro(campoApellidos.value, 100, "tus apellidos"));
});

campoCorreo.addEventListener("input", function () {
    ocultarMensajeRegistro();
    pintarCampo(campoCorreo, errorCorreoReg, validarCorreoRegistro(campoCorreo.value));
});

campoContrasena.addEventListener("input", function () {
    ocultarMensajeRegistro();
    pintarCampo(campoContrasena, errorContrasenaReg,
        validarContrasena(campoContrasena.value));

    if (campoRepetir.value.trim() !== "") {
        pintarCampo(campoRepetir, errorRepetirReg, validarRepeticion());
    }
});

campoRepetir.addEventListener("input", function () {
    ocultarMensajeRegistro();
    pintarCampo(campoRepetir, errorRepetirReg, validarRepeticion());
});

campoTelefono.addEventListener("input", function () {
    ocultarMensajeRegistro();
    pintarCampo(campoTelefono, errorTelefonoReg,
        validarTelefonoRegistro(campoTelefono.value));
});

campoDireccion.addEventListener("input", function () {
    ocultarMensajeRegistro();
    pintarCampo(campoDireccion, errorDireccionReg, "");
});

campoComuna.addEventListener("input", function () {
    ocultarMensajeRegistro();
    revisarComunaRegistro();
});


// ==========================================
// CREAR LA CUENTA
// ==========================================

formRegistro.addEventListener("submit", function (evento) {
    evento.preventDefault();
    ocultarMensajeRegistro();

    const fallas = {
        regNombre: validarTextoRegistro(campoNombre.value, 50, "tu nombre"),
        regApellidos: validarTextoRegistro(campoApellidos.value, 100, "tus apellidos"),
        regCorreo: validarCorreoRegistro(campoCorreo.value),
        regContrasena: validarContrasena(campoContrasena.value),
        regRepetir: validarRepeticion(),
        regTelefono: validarTelefonoRegistro(campoTelefono.value)
    };

    pintarCampo(campoNombre, errorNombreReg, fallas.regNombre);
    pintarCampo(campoApellidos, errorApellidosReg, fallas.regApellidos);
    pintarCampo(campoCorreo, errorCorreoReg, fallas.regCorreo);
    pintarCampo(campoContrasena, errorContrasenaReg, fallas.regContrasena);
    pintarCampo(campoRepetir, errorRepetirReg, fallas.regRepetir);
    pintarCampo(campoTelefono, errorTelefonoReg, fallas.regTelefono);

    const campos = {
        regNombre: campoNombre,
        regApellidos: campoApellidos,
        regCorreo: campoCorreo,
        regContrasena: campoContrasena,
        regRepetir: campoRepetir,
        regTelefono: campoTelefono
    };

    const primerError = Object.keys(fallas).find(function (clave) {
        return fallas[clave] !== "";
    });

    if (primerError) {
        campos[primerError].focus();
        return;
    }


    const correo = campoCorreo.value.trim().toLowerCase();

    if (correoYaRegistrado(correo)) {
        mostrarMensajeRegistro("Ese correo ya tiene una cuenta. Inicia sesión o usa otro.");
        campoCorreo.classList.add("campo-invalido");
        campoCorreo.classList.remove("campo-valido");
        campoCorreo.focus();
        return;
    }


    const nombre = campoNombre.value.trim();
    const apellidos = campoApellidos.value.trim();
    const nombreCompleto = nombre + " " + apellidos;

    permitirCuentaDeNuevo(correo);

    guardarUsuarioNuevo({
        nombre: nombreCompleto,
        correo: correo,
        contrasena: campoContrasena.value.trim(),
        rol: "CLIENTE",
        activo: true
    });

    localStorage.setItem("perfil_" + correo, JSON.stringify({
        nombre: nombre,
        apellidos: apellidos,
        telefono: campoTelefono.value.trim(),
        direccion: campoDireccion.value.trim(),
        comuna: campoComuna.value.trim()
    }));

    guardarSesion({
        nombre: nombreCompleto,
        correo: correo,
        rol: "CLIENTE"
    });

    window.location.href = "perfil.html";
});


function guardarUsuarioNuevo(usuario) {
    const guardados = localStorage.getItem("usuariosSistema");

    let usuarios = [];

    if (guardados) {
        try {
            const lista = JSON.parse(guardados);

            if (Array.isArray(lista)) {
                usuarios = lista;
            }
        } catch (error) {
            usuarios = [];
        }
    }

    if (usuarios.length === 0) {
        usuarios = USUARIOS.map(function (base, indice) {
            return {
                id: indice + 1,
                nombre: base.nombre,
                correo: base.correo,
                contrasena: base.contrasena,
                rol: base.rol,
                activo: true
            };
        });
    }

    let mayorId = 0;

    usuarios.forEach(function (registro) {
        if (Number(registro.id) > mayorId) {
            mayorId = Number(registro.id);
        }
    });

    usuario.id = mayorId + 1;
    usuarios.push(usuario);

    localStorage.setItem("usuariosSistema", JSON.stringify(usuarios));
}
