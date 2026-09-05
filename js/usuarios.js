const CLAVE_USUARIOS_SISTEMA = "usuariosSistema";

const tablaUsuarios = document.getElementById("tablaUsuarios");
const btnNuevoUsuario = document.getElementById("btnNuevoUsuario");

const formUsuario = document.getElementById("formUsuario");

const usuarioId = document.getElementById("usuarioId");
const nombreUsuario = document.getElementById("nombreUsuario");
const correoUsuario = document.getElementById("correoUsuario");
const contrasenaUsuario = document.getElementById("contrasenaUsuario");
const rolUsuarioForm = document.getElementById("rolUsuarioForm");

const runUsuario = document.getElementById("runUsuario");
const apellidosUsuario = document.getElementById("apellidosUsuario");
const nacimientoUsuario = document.getElementById("nacimientoUsuario");
const regionUsuario = document.getElementById("regionUsuario");
const comunaUsuario = document.getElementById("comunaUsuario");
const direccionUsuario = document.getElementById("direccionUsuario");

const errorRun = document.getElementById("errorRun");
const errorApellidos = document.getElementById("errorApellidos");
const errorDireccion = document.getElementById("errorDireccion");
const avisoCoberturaUsuario = document.getElementById("avisoCoberturaUsuario");

const errorNombre = document.getElementById("errorNombre");
const errorCorreo = document.getElementById("errorCorreo");
const errorContrasena = document.getElementById("errorContrasena");
const errorRol = document.getElementById("errorRol");

const tituloModalUsuario = document.getElementById("tituloModalUsuario");

const modalUsuario = new bootstrap.Modal(
    document.getElementById("modalUsuario")
);


// ==========================================
// CARGAR USUARIOS
// ==========================================

function runValido(valor) {
    const run = String(valor).trim().toUpperCase();

    if (!/^[0-9]{6,8}[0-9K]$/.test(run)) {
        return false;
    }

    const cuerpo = run.slice(0, -1);
    const verificador = run.slice(-1);

    let suma = 0;
    let factor = 2;

    for (let i = cuerpo.length - 1; i >= 0; i = i - 1) {
        suma = suma + Number(cuerpo[i]) * factor;
        factor = factor === 7 ? 2 : factor + 1;
    }

    const resto = 11 - (suma % 11);

    const esperado =
        resto === 11
            ? "0"
            : resto === 10
                ? "K"
                : String(resto);

    return verificador === esperado;
}


function llenarRegiones() {
    if (!regionUsuario || typeof nombresDeRegiones !== "function") {
        return;
    }

    regionUsuario.innerHTML =
        '<option value="">Selecciona una región</option>' +
        nombresDeRegiones().map(function (nombre) {
            return '<option value="' + nombre + '">' + nombre + "</option>";
        }).join("");
}


function llenarComunas(nombreRegion, comunaElegida) {
    if (!comunaUsuario) {
        return;
    }

    const comunas =
        typeof comunasDeRegion === "function"
            ? comunasDeRegion(nombreRegion)
            : [];

    if (comunas.length === 0) {
        comunaUsuario.innerHTML =
            '<option value="">Elige primero una región</option>';
        comunaUsuario.disabled = true;
        return;
    }

    comunaUsuario.innerHTML =
        '<option value="">Selecciona una comuna</option>' +
        comunas.map(function (comuna) {
            const marca = comuna === comunaElegida ? " selected" : "";
            return '<option value="' + comuna + '"' + marca + ">" + comuna + "</option>";
        }).join("");

    comunaUsuario.disabled = false;
}


function revisarCoberturaUsuario() {
    if (!avisoCoberturaUsuario) {
        return;
    }

    const comuna = comunaUsuario ? comunaUsuario.value.trim() : "";

    if (comuna === "" || typeof buscarZona !== "function") {
        avisoCoberturaUsuario.textContent = "";
        avisoCoberturaUsuario.className = "mt-1 small";
        return;
    }

    const zona = buscarZona(comuna);

    if (zona) {
        avisoCoberturaUsuario.textContent =
            "Con despacho: " + zona.zona + ", " + zona.dias + ".";

        avisoCoberturaUsuario.className = "mt-1 small aviso-cobertura-ok";
    } else {
        avisoCoberturaUsuario.textContent =
            "Sin reparto en esa comuna. La cuenta se crea igual.";

        avisoCoberturaUsuario.className = "mt-1 small aviso-cobertura-no";
    }
}


function obtenerUsuariosSistema() {

    const guardados =
        localStorage.getItem(CLAVE_USUARIOS_SISTEMA);

    let usuariosSistema = [];

    if (guardados) {

        try {
            usuariosSistema = JSON.parse(guardados);

            if (!Array.isArray(usuariosSistema)) {
                usuariosSistema = [];
            }

        } catch (error) {
            usuariosSistema = [];
        }
    }


    // ==========================================
    // MIGRAR DOMINIO ANTIGUO AL NUEVO
    // @gasvolcan.cl -> @gaselvolcan.cl
    // ==========================================

    usuariosSistema.forEach(function (usuario) {

        if (!usuario.correo) {
            return;
        }

        usuario.correo =
            usuario.correo
                .trim()
                .toLowerCase()
                .replace(
                    "@gasvolcan.cl",
                    "@gaselvolcan.cl"
                );

    });


    // ==========================================
    // ELIMINAR DUPLICADOS POR CORREO
    // ==========================================

    const correosEncontrados = [];

    usuariosSistema =
        usuariosSistema.filter(function (usuario) {

            const correo =
                usuario.correo.trim().toLowerCase();

            if (correosEncontrados.includes(correo)) {
                return false;
            }

            correosEncontrados.push(correo);

            return true;

        });


    // ==========================================
    // AGREGAR USUARIOS BASE QUE FALTEN
    // ==========================================

    let siguienteId = 1;

    if (usuariosSistema.length > 0) {

        siguienteId =
            Math.max(
                ...usuariosSistema.map(function (usuario) {
                    return Number(usuario.id) || 0;
                })
            ) + 1;
    }


    USUARIOS.forEach(function (usuarioBase) {

        const correoBase =
            usuarioBase.correo
                .trim()
                .toLowerCase();

        const existe =
            usuariosSistema.some(function (usuario) {

                return (
                    usuario.correo
                        .trim()
                        .toLowerCase()
                    === correoBase
                );

            });


        if (!existe && !cuentaEliminada(correoBase)) {

            usuariosSistema.push({

                id: siguienteId,
                run: usuarioBase.run || "",
                nombre: usuarioBase.nombre,
                apellidos: usuarioBase.apellidos || "",
                nacimiento: "",
                region: usuarioBase.region || "",
                comuna: usuarioBase.comuna || "",
                direccion: usuarioBase.direccion || "",
                correo: correoBase,
                contrasena: usuarioBase.contrasena,
                rol: usuarioBase.rol,
                activo: true

            });

            siguienteId++;

        }

    });


    guardarUsuariosSistema(
        usuariosSistema
    );

    return usuariosSistema;
}


// ==========================================
// GUARDAR USUARIOS
// ==========================================

function guardarUsuariosSistema(usuarios) {

    localStorage.setItem(
        CLAVE_USUARIOS_SISTEMA,
        JSON.stringify(usuarios)
    );

}


// ==========================================
// MOSTRAR USUARIOS EN TABLA
// ==========================================

function mostrarUsuarios() {

    const usuarios = obtenerUsuariosSistema();

    tablaUsuarios.innerHTML = "";

    usuarios.forEach(function (usuario) {

        const fila = document.createElement("tr");

        const estadoTexto =
            usuario.activo
                ? "Activo"
                : "Inactivo";

        const estadoClase =
            usuario.activo
                ? "bg-success"
                : "bg-secondary";

        fila.innerHTML = `
            <td>
                <strong>${usuario.nombre}</strong>
            </td>

            <td>
                ${usuario.correo}
            </td>

            <td>
                ${obtenerNombreRol(usuario.rol)}
            </td>

            <td>
                <span class="badge ${estadoClase}">
                    ${estadoTexto}
                </span>
            </td>

            <td>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary me-1"
                    onclick="editarUsuario(${usuario.id})"
                >
                    Editar
                </button>

                <button
                    type="button"
                    class="btn btn-sm ${
                        usuario.activo
                            ? "btn-outline-warning"
                            : "btn-outline-success"
                    } me-1"
                    onclick="cambiarEstadoUsuario(${usuario.id})"
                >
                    ${
                        usuario.activo
                            ? "Desactivar"
                            : "Activar"
                    }
                </button>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    onclick="eliminarUsuario(${usuario.id})"
                >
                    Eliminar
                </button>

            </td>
        `;

        tablaUsuarios.appendChild(fila);

    });

}


// ==========================================
// BOTÓN CREAR USUARIO
// ==========================================

btnNuevoUsuario.addEventListener("click", function () {

    limpiarFormulario();

    tituloModalUsuario.textContent =
        "Crear usuario";

    contrasenaUsuario.required = true;

    modalUsuario.show();

});


// ==========================================
// GUARDAR / EDITAR USUARIO
// ==========================================

formUsuario.addEventListener("submit", function (event) {

    event.preventDefault();

    limpiarErrores();

    const run = runUsuario.value.trim().toUpperCase();
    const nombre = nombreUsuario.value.trim();
    const apellidos = apellidosUsuario.value.trim();
    const nacimiento = nacimientoUsuario.value;
    const region = regionUsuario.value;
    const comuna = comunaUsuario.value;
    const direccion = direccionUsuario.value.trim();
    const correo = correoUsuario.value.trim().toLowerCase();
    const contrasena = contrasenaUsuario.value.trim();
    const rol = rolUsuarioForm.value;

    const id = Number(usuarioId.value);

    let formularioValido = true;


    // RUN

    if (run === "") {

        errorRun.textContent =
            "Ingresa el RUN.";

        formularioValido = false;

    }

    else if (run.length < 7 || run.length > 9) {

        errorRun.textContent =
            "El RUN debe tener entre 7 y 9 caracteres, sin puntos ni guion.";

        formularioValido = false;

    }

    else if (!runValido(run)) {

        errorRun.textContent =
            "Ese RUN no es válido. Revisa el dígito verificador.";

        formularioValido = false;

    }


    // NOMBRE

    if (nombre === "") {

        errorNombre.textContent =
            "Ingresa el nombre del usuario.";

        formularioValido = false;

    }

    else if (nombre.length > 50) {

        errorNombre.textContent =
            "El nombre no puede superar los 50 caracteres.";

        formularioValido = false;

    }


    // APELLIDOS

    if (apellidos === "") {

        errorApellidos.textContent =
            "Ingresa los apellidos.";

        formularioValido = false;

    }

    else if (apellidos.length > 100) {

        errorApellidos.textContent =
            "Los apellidos no pueden superar los 100 caracteres.";

        formularioValido = false;

    }


    // DIRECCION

    if (direccion === "") {

        errorDireccion.textContent =
            "Ingresa la dirección.";

        formularioValido = false;

    }

    else if (direccion.length > 300) {

        errorDireccion.textContent =
            "La dirección no puede superar los 300 caracteres.";

        formularioValido = false;

    }


    // CORREO

    if (correo === "") {

        errorCorreo.textContent =
            "Ingresa un correo.";

        formularioValido = false;

    }

    else if (correo.length > 100) {

        errorCorreo.textContent =
            "El correo no puede superar los 100 caracteres.";

        formularioValido = false;

    }


    // ROL

    if (rol === "") {

        errorRol.textContent =
            "Selecciona un rol.";

        formularioValido = false;

    }


    // CONTRASEÑA

    if (!id || contrasena !== "") {

        if (contrasena.length < 4) {

            errorContrasena.textContent =
                "La contraseña debe tener al menos 4 caracteres.";

            formularioValido = false;

        }

        else if (contrasena.length > 10) {

            errorContrasena.textContent =
                "La contraseña no puede superar los 10 caracteres.";

            formularioValido = false;

        }

    }


    if (!formularioValido) {
        return;
    }


    const usuarios = obtenerUsuariosSistema();


    // EVITAR CORREOS REPETIDOS

    const correoExiste = usuarios.some(function (usuario) {

        return (
            usuario.correo.toLowerCase() === correo
            &&
            usuario.id !== id
        );

    });


    if (correoExiste) {

        errorCorreo.textContent =
            "Ya existe un usuario con ese correo.";

        return;

    }


    // EDITAR

    if (id) {

        const usuario = usuarios.find(function (usuario) {

            return usuario.id === id;

        });


        if (!usuario) {
            return;
        }


        usuario.nombre = nombre;
        usuario.correo = correo;
        usuario.rol = rol;

        usuario.run = run;
        usuario.apellidos = apellidos;
        usuario.nacimiento = nacimiento;
        usuario.region = region;
        usuario.comuna = comuna;
        usuario.direccion = direccion;


        if (contrasena !== "") {
            usuario.contrasena = contrasena;
        }

    }


    // CREAR

    else {

        const nuevoId =
            usuarios.length > 0
                ? Math.max(
                    ...usuarios.map(function (usuario) {
                        return usuario.id;
                    })
                ) + 1
                : 1;


        usuarios.push({

            id: nuevoId,
            run: run,
            nombre: nombre,
            apellidos: apellidos,
            nacimiento: nacimiento,
            region: region,
            comuna: comuna,
            direccion: direccion,
            correo: correo,
            contrasena: contrasena,
            rol: rol,
            activo: true

        });

    }


    guardarUsuariosSistema(usuarios);

    mostrarUsuarios();

    modalUsuario.hide();

});


// ==========================================
// EDITAR USUARIO
// ==========================================

function editarUsuario(id) {

    const usuarios = obtenerUsuariosSistema();

    const usuario = usuarios.find(function (usuario) {

        return usuario.id === id;

    });


    if (!usuario) {
        return;
    }


    limpiarFormulario();

    usuarioId.value = usuario.id;
    runUsuario.value = usuario.run || "";
    nombreUsuario.value = usuario.nombre;
    apellidosUsuario.value = usuario.apellidos || "";
    nacimientoUsuario.value = usuario.nacimiento || "";
    direccionUsuario.value = usuario.direccion || "";
    correoUsuario.value = usuario.correo;
    rolUsuarioForm.value = usuario.rol;

    regionUsuario.value = usuario.region || "";
    llenarComunas(regionUsuario.value, usuario.comuna || "");
    revisarCoberturaUsuario();

    contrasenaUsuario.value = "";
    contrasenaUsuario.required = false;

    contrasenaUsuario.placeholder =
        "Déjala vacía para mantenerla";

    tituloModalUsuario.textContent =
        "Editar usuario";

    modalUsuario.show();

}


// ==========================================
// ACTIVAR / DESACTIVAR
// ==========================================

function cambiarEstadoUsuario(id) {

    const usuarios = obtenerUsuariosSistema();

    const usuario = usuarios.find(function (usuario) {

        return usuario.id === id;

    });


    if (!usuario) {
        return;
    }


    const sesionActual = obtenerSesion();


    if (
        sesionActual &&
        usuario.correo === sesionActual.correo
    ) {

        alert(
            "No puedes desactivar tu propia cuenta."
        );

        return;

    }


    usuario.activo = !usuario.activo;

    guardarUsuariosSistema(usuarios);

    mostrarUsuarios();

}


// ==========================================
// ELIMINAR USUARIO
// ==========================================

function eliminarUsuario(id) {

    const usuarios = obtenerUsuariosSistema();

    const usuario = usuarios.find(function (usuario) {

        return usuario.id === id;

    });


    if (!usuario) {
        return;
    }


    const sesionActual = obtenerSesion();


    if (
        sesionActual &&
        usuario.correo === sesionActual.correo
    ) {

        alert(
            "No puedes eliminar tu propia cuenta."
        );

        return;

    }


    const confirmar = confirm(
        "¿Seguro que deseas eliminar a " +
        usuario.nombre +
        "?"
    );


    if (!confirmar) {
        return;
    }


    const usuariosActualizados =
        usuarios.filter(function (usuarioActual) {

            return usuarioActual.id !== id;

        });


    marcarCuentaEliminada(usuario.correo);

    guardarUsuariosSistema(
        usuariosActualizados
    );

    mostrarUsuarios();

}


// ==========================================
// MOSTRAR NOMBRE DEL ROL
// ==========================================

function obtenerNombreRol(rol) {

    if (rol === "ADMINISTRADOR") {
        return "Administrador";
    }

    if (rol === "DESPACHADORA") {
        return "Despachadora";
    }

    if (rol === "REPARTIDOR") {
        return "Repartidor";
    }

    if (rol === "CLIENTE") {
        return "Cliente";
    }

    return rol;

}


// ==========================================
// LIMPIAR FORMULARIO
// ==========================================

function limpiarFormulario() {

    formUsuario.reset();

    usuarioId.value = "";

    contrasenaUsuario.required = true;

    contrasenaUsuario.placeholder = "";

    llenarComunas("", "");
    revisarCoberturaUsuario();

    limpiarErrores();

}


// ==========================================
// LIMPIAR ERRORES
// ==========================================

function limpiarErrores() {

    errorRun.textContent = "";
    errorNombre.textContent = "";
    errorApellidos.textContent = "";
    errorDireccion.textContent = "";
    errorCorreo.textContent = "";
    errorContrasena.textContent = "";
    errorRol.textContent = "";

}


// ==========================================
// INICIAR
// ==========================================

mostrarUsuarios();


// ==========================================
// REGION -> COMUNA
// ==========================================

llenarRegiones();

if (regionUsuario) {
    regionUsuario.addEventListener("change", function () {
        llenarComunas(regionUsuario.value, "");
        revisarCoberturaUsuario();
    });
}

if (comunaUsuario) {
    comunaUsuario.addEventListener("change", revisarCoberturaUsuario);
}
