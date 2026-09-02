const formPerfil = document.getElementById("formPerfil");

if (formPerfil) {
    const sesionPerfil = obtenerSesion();

    if (!sesionPerfil) {
        window.location.replace("login.html");
    } else {
        iniciarPerfil(sesionPerfil);
    }
}

function claveDatosPerfil(correo) {
    return "perfil_" + String(correo).toLowerCase();
}

function obtenerDatosPerfil(correo) {
    const guardado = localStorage.getItem(claveDatosPerfil(correo));

    if (!guardado) {
        return {};
    }

    try {
        return JSON.parse(guardado) || {};
    } catch (error) {
        return {};
    }
}

function iniciarPerfil(usuario) {
    const campos = {
        nombre: document.getElementById("perfilNombre"),
        apellidos: document.getElementById("perfilApellidos"),
        correo: document.getElementById("perfilCorreo"),
        telefono: document.getElementById("perfilTelefono"),
        direccion: document.getElementById("perfilDireccion"),
        comuna: document.getElementById("perfilComuna")
    };

    const errores = {
        nombre: document.getElementById("errorPerfilNombre"),
        apellidos: document.getElementById("errorPerfilApellidos"),
        telefono: document.getElementById("errorPerfilTelefono"),
        direccion: document.getElementById("errorPerfilDireccion")
    };

    const guardado = document.getElementById("perfilGuardado");
    const avisoComuna = document.getElementById("avisoComuna");
    const datos = obtenerDatosPerfil(usuario.correo);
    const partes = String(usuario.nombre).trim().split(/\s+/);

    campos.nombre.value = datos.nombre || partes[0] || "";
    campos.apellidos.value = datos.apellidos || partes.slice(1).join(" ") || "";
    campos.correo.value = usuario.correo;
    campos.telefono.value = datos.telefono || "";
    campos.direccion.value = datos.direccion || "";
    campos.comuna.value = datos.comuna || "";

    function validarTexto(valor, minimo, maximo, etiqueta) {
        const texto = valor.trim();

        if (texto.length < minimo) {
            return "Ingresa " + etiqueta + ".";
        }

        if (texto.length > maximo) {
            return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1) + " no puede superar los " + maximo + " caracteres.";
        }

        return "";
    }

    function validarTelefono(valor) {
        const telefono = valor.trim();

        if (telefono === "") {
            return "";
        }

        if (!/^[+0-9\s]{8,15}$/.test(telefono)) {
            return "Usa solo números, espacios y el signo +.";
        }

        return "";
    }

    function pintar(campo, contenedor, mensaje) {
        if (!contenedor) {
            return;
        }

        contenedor.textContent = mensaje;

        if (campo.value.trim() === "") {
            campo.classList.remove("campo-valido", "campo-invalido");
            return;
        }

        campo.classList.toggle("campo-valido", mensaje === "");
        campo.classList.toggle("campo-invalido", mensaje !== "");
    }

    function revisarComuna() {
        const valor = campos.comuna.value.trim();

        if (valor === "" || typeof buscarZona !== "function") {
            avisoComuna.textContent = "";
            avisoComuna.className = "mensaje-ayuda";
            return;
        }

        const zona = buscarZona(valor);

        if (zona) {
            avisoComuna.textContent = "Llegamos a tu comuna: " + zona.zona + ", " + zona.dias + ".";
            avisoComuna.className = "mensaje-ayuda aviso-cobertura-ok";
        } else {
            avisoComuna.textContent = "Todavía no tenemos reparto en esa comuna.";
            avisoComuna.className = "mensaje-ayuda aviso-cobertura-no";
        }
    }

    campos.nombre.addEventListener("input", function () {
        ocultarGuardado();
        pintar(campos.nombre, errores.nombre, validarTexto(campos.nombre.value, 1, 50, "tu nombre"));
    });

    campos.apellidos.addEventListener("input", function () {
        ocultarGuardado();
        pintar(campos.apellidos, errores.apellidos, validarTexto(campos.apellidos.value, 1, 100, "tus apellidos"));
    });

    campos.telefono.addEventListener("input", function () {
        ocultarGuardado();
        pintar(campos.telefono, errores.telefono, validarTelefono(campos.telefono.value));
    });

    campos.direccion.addEventListener("input", function () {
        ocultarGuardado();
        pintar(campos.direccion, errores.direccion, validarTexto(campos.direccion.value, 1, 300, "tu dirección"));
    });

    campos.comuna.addEventListener("input", function () {
        ocultarGuardado();
        revisarComuna();
    });

    formPerfil.addEventListener("submit", function (evento) {
        evento.preventDefault();
        ocultarGuardado();

        const fallas = {
            nombre: validarTexto(campos.nombre.value, 1, 50, "tu nombre"),
            apellidos: validarTexto(campos.apellidos.value, 1, 100, "tus apellidos"),
            telefono: validarTelefono(campos.telefono.value),
            direccion: usuario.rol === "CLIENTE"
                ? validarTexto(campos.direccion.value, 1, 300, "tu dirección")
                : ""
        };

        pintar(campos.nombre, errores.nombre, fallas.nombre);
        pintar(campos.apellidos, errores.apellidos, fallas.apellidos);
        pintar(campos.telefono, errores.telefono, fallas.telefono);
        pintar(campos.direccion, errores.direccion, fallas.direccion);

        const primerError = ["nombre", "apellidos", "telefono", "direccion"].find(function (clave) {
            return fallas[clave] !== "";
        });

        if (primerError) {
            campos[primerError].focus();
            return;
        }

        const nuevos = {
            nombre: campos.nombre.value.trim(),
            apellidos: campos.apellidos.value.trim(),
            telefono: campos.telefono.value.trim(),
            direccion: campos.direccion.value.trim(),
            comuna: campos.comuna.value.trim()
        };

        localStorage.setItem(claveDatosPerfil(usuario.correo), JSON.stringify(nuevos));

        guardarSesion({
            nombre: nuevos.nombre + " " + nuevos.apellidos,
            correo: usuario.correo,
            rol: usuario.rol
        });

        guardado.textContent = "Tus datos se guardaron correctamente.";
        guardado.classList.remove("d-none");
        pintarNavCuenta();
    });

    function ocultarGuardado() {
        guardado.classList.add("d-none");
        guardado.textContent = "";
    }

    revisarComuna();
    mostrarSaludo(usuario);
    mostrarColumnaDerecha(usuario);
    prepararBaja(usuario);
}

function prepararBaja(usuario) {
    const zona = document.getElementById("zonaBaja");
    const boton = document.getElementById("botonEliminarCuenta");

    if (!zona || usuario.rol !== "CLIENTE") {
        return;
    }

    zona.classList.remove("d-none");

    const ventana = new bootstrap.Modal(
        document.getElementById("modalEliminarCuenta")
    );

    boton.addEventListener("click", function () {
        document.getElementById("correoAEliminar").textContent = usuario.correo;
        ventana.show();
    });

    document.getElementById("confirmarEliminarCuenta")
        .addEventListener("click", function () {
            eliminarCuenta(usuario.correo);
        });
}

function eliminarCuenta(correo) {
    const limpio = String(correo).trim().toLowerCase();

    const guardados = localStorage.getItem("usuariosSistema");

    if (guardados) {
        try {
            const lista = JSON.parse(guardados);

            if (Array.isArray(lista)) {
                const quedan = lista.filter(function (registro) {
                    return String(registro.correo).trim().toLowerCase() !== limpio;
                });

                localStorage.setItem("usuariosSistema", JSON.stringify(quedan));
            }
        } catch (error) {
            localStorage.removeItem("usuariosSistema");
        }
    }

    marcarCuentaEliminada(limpio);

    localStorage.removeItem(claveDatosPerfil(limpio));

    const pedidosAjenos = obtenerPedidos().filter(function (pedido) {
        return String(pedido.correo).trim().toLowerCase() !== limpio;
    });

    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidosAjenos));

    cerrarSesion();

    window.location.href = "index.html";
}

function mostrarSaludo(usuario) {
    const bajada = document.getElementById("perfilBajada");

    if (!bajada) {
        return;
    }

    if (usuario.rol === "CLIENTE") {
        bajada.textContent = "Hola, " + primerNombre(usuario.nombre) +
            ". Revisa tus datos y el historial de tus pedidos.";
        return;
    }

    bajada.textContent = "Hola, " + primerNombre(usuario.nombre) +
        ". Revisa y actualiza tus datos de contacto.";
}

function mostrarColumnaDerecha(usuario) {
    const bloqueRol = document.getElementById("perfilBloqueRol");
    const bloquePedidos = document.getElementById("perfilBloquePedidos");

    if (usuario.rol === "CLIENTE") {
        mostrarPedidos(usuario);
        return;
    }

    bloquePedidos.classList.add("d-none");
    bloqueRol.classList.remove("d-none");

    document.querySelectorAll(".solo-cliente").forEach(function (elemento) {
        elemento.classList.add("d-none");
    });

    const volver = document.getElementById("navVolverPanel");

    if (volver) {
        volver.querySelector("a").href = panelDeRol(usuario.rol);
        volver.classList.remove("d-none");
    }

    document.getElementById("perfilNombreRol").textContent = nombreDeRol(usuario.rol);

    document.getElementById("perfilRolNota").textContent =
        "Tu correo " + usuario.correo + " tiene acceso al panel de trabajo.";

    document.getElementById("perfilEnlacePanel").href = panelDeRol(usuario.rol);
}

function mostrarPedidos(usuario) {
    const lista = document.getElementById("listaPedidos");
    const vacio = document.getElementById("perfilSinPedidos");
    const resumen = document.getElementById("perfilResumenPedidos");
    const pedidos = pedidosDe(usuario.correo);

    if (pedidos.length === 0) {
        vacio.classList.remove("d-none");
        resumen.textContent = "Aquí verás el detalle de cada compra.";
        return;
    }

    resumen.textContent = pedidos.length === 1
        ? "Tienes 1 pedido registrado."
        : "Tienes " + pedidos.length + " pedidos registrados.";

    lista.innerHTML = pedidos.map(function (pedido) {
        const fecha = new Date(pedido.fecha).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        const detalle = pedido.lineas.map(function (linea) {
            return "<li>" + linea.cantidad + " × " + linea.nombre +
                "<span>" + formatearMonto(linea.subtotal) + "</span></li>";
        }).join("");

        return '<li class="pedido">' +
            '<div class="pedido-cabecera">' +
            "<div>" +
            '<p class="pedido-numero">Pedido N° ' + pedido.numero + "</p>" +
            '<p class="pedido-fecha">' + fecha + "</p>" +
            "</div>" +
            '<strong class="pedido-total">' + formatearMonto(pedido.total) + "</strong>" +
            "</div>" +
            '<ul class="pedido-lineas list-unstyled">' + detalle + "</ul>" +
            "</li>";
    }).join("");
}
