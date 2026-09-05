const CLAVE_SESION = "usuarioActivo";

const USUARIOS = [
    {
        nombre: "Sofía Pérez",
        correo: "admin@gaselvolcan.cl",
        run: "152348762",
        apellidos: "Pérez Soto",
        region: "Ñuble",
        comuna: "Chillán",
        direccion: "Av. Libertad 1240",
        contrasena: "Admin1234",
        rol: "ADMINISTRADOR"
    },
    {
        nombre: "Daniela Fuentes",
        correo: "despachadora@gaselvolcan.cl",
        run: "178452010",
        apellidos: "Fuentes Rivas",
        region: "Ñuble",
        comuna: "Chillán",
        direccion: "Calle Arauco 455",
        contrasena: "Desp123",
        rol: "DESPACHADORA"
    },
    {
        nombre: "Matías Vera",
        correo: "repartidor@gaselvolcan.cl",
        run: "160923342",
        apellidos: "Vera Muñoz",
        region: "Ñuble",
        comuna: "Chillán Viejo",
        direccion: "Camino Real 88",
        contrasena: "Repart123",
        rol: "REPARTIDOR"
    },
    {
        nombre: "Rodrigo Peña",
        correo: "repartidor2@gaselvolcan.cl",
        run: "184501279",
        apellidos: "Peña Castro",
        region: "Ñuble",
        comuna: "Bulnes",
        direccion: "Los Robles 210",
        contrasena: "Repart123",
        rol: "REPARTIDOR"
    },
    {
        nombre: "Camila Rojas",
        correo: "cliente@gmail.com",
        run: "193387454",
        apellidos: "Rojas Herrera",
        region: "Ñuble",
        comuna: "Chillán",
        direccion: "Av. O'Higgins 850",
        contrasena: "Clien1234",
        rol: "CLIENTE"
    }
];

const DOMINIOS_PERMITIDOS = ["@gaselvolcan.cl", "@duoc.cl", "@profesor.duoc.cl", "@gmail.com"];

function obtenerSesion() {
    const guardado = localStorage.getItem(CLAVE_SESION);

    if (!guardado) {
        return null;
    }

    try {
        return JSON.parse(guardado);
    } catch (error) {
        localStorage.removeItem(CLAVE_SESION);
        return null;
    }
}

function guardarSesion(usuario) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
}

function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
}

function validarCorreo(valor) {
    const correo = valor.trim().toLowerCase();

    if (correo === "") {
        return "Ingresa tu correo electrónico.";
    }

    if (correo.length > 100) {
        return "El correo no puede superar los 100 caracteres.";
    }

    const dominioValido = DOMINIOS_PERMITIDOS.some(function (dominio) {
        return correo.endsWith(dominio);
    });

    if (!dominioValido) {
        return "Usa un correo @gaselvolcan.cl si eres del equipo, o @gmail.com si eres cliente.";
    }

    return "";
}

function validarContrasena(valor) {
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

function primerNombre(nombreCompleto) {
    return nombreCompleto.split(" ")[0];
}

function iniciales(nombreCompleto) {
    const partes = String(nombreCompleto).trim().split(/\s+/);

    if (partes.length === 1) {
        return partes[0].slice(0, 2).toUpperCase();
    }

    return (partes[0][0] + partes[1][0]).toUpperCase();
}

function rutaBase() {
    if (window.location.pathname.indexOf("/admin/") !== -1) {
        return "../";
    }

    return "";
}

function panelDeRol(rol) {
    if (rol === "ADMINISTRADOR") {
        return "admin/index.html";
    }

    if (rol === "DESPACHADORA") {
        return "despachadora.html";
    }

    if (rol === "REPARTIDOR") {
        return "repartidor.html";
    }

    return "";
}

function nombreDeRol(rol) {
    if (rol === "ADMINISTRADOR") {
        return "Administrador";
    }

    if (rol === "DESPACHADORA") {
        return "Despachadora";
    }

    if (rol === "REPARTIDOR") {
        return "Repartidor";
    }

    return "Cliente";
}

function pintarNavCuenta() {
    const contenedor = document.getElementById("navCuenta");

    if (!contenedor) {
        return;
    }

    const usuario = obtenerSesion();

    if (!usuario) {
        contenedor.innerHTML =
            '<a class="btn btn-cuenta" href="' + rutaBase() + 'login.html">Ingresar</a>';
        return;
    }

    const rotulo = usuario.nombre + " (" + nombreDeRol(usuario.rol) + ")";

    const insignia = usuario.rol === "CLIENTE"
        ? ""
        : '<span class="rol-insignia">' + nombreDeRol(usuario.rol) + "</span>";

    contenedor.innerHTML =
        '<div class="cuenta-activa">' +
        '<a class="avatar-cuenta" href="' + rutaBase() + 'perfil.html" title="' + rotulo + ' — ir a mi perfil">' +
        '<span aria-hidden="true">' + iniciales(usuario.nombre) + "</span>" +
        '<span class="visually-hidden">Mi perfil: ' + rotulo + "</span>" +
        "</a>" +
        insignia +
        '<button type="button" class="btn btn-cuenta" id="botonCerrarSesion">Salir</button>' +
        "</div>";

    document.getElementById("botonCerrarSesion").addEventListener("click", function () {
        cerrarSesion();
        window.location.reload();
    });
}

document.addEventListener("DOMContentLoaded", pintarNavCuenta);

const CLAVE_PEDIDOS = "pedidosVolcan";

function obtenerPedidos() {
    const guardado = localStorage.getItem(CLAVE_PEDIDOS);

    if (!guardado) {
        return [];
    }

    try {
        const lista = JSON.parse(guardado);
        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        return [];
    }
}

function guardarPedido(pedido) {
    const pedidos = obtenerPedidos();
    pedidos.unshift(pedido);
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
}

function pedidosDe(correo) {
    return obtenerPedidos().filter(function (pedido) {
        return String(pedido.correo).toLowerCase() === String(correo).toLowerCase();
    });
}

const CLAVE_CUENTAS_ELIMINADAS = "cuentasEliminadas";

function correosEliminados() {
    const guardado = localStorage.getItem(CLAVE_CUENTAS_ELIMINADAS);

    if (!guardado) {
        return [];
    }

    try {
        const lista = JSON.parse(guardado);
        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        return [];
    }
}

function cuentaEliminada(correo) {
    return correosEliminados().indexOf(String(correo).trim().toLowerCase()) !== -1;
}

function marcarCuentaEliminada(correo) {
    const limpio = String(correo).trim().toLowerCase();
    const lista = correosEliminados();

    if (lista.indexOf(limpio) === -1) {
        lista.push(limpio);
        localStorage.setItem(CLAVE_CUENTAS_ELIMINADAS, JSON.stringify(lista));
    }
}

function permitirCuentaDeNuevo(correo) {
    const limpio = String(correo).trim().toLowerCase();

    const lista = correosEliminados().filter(function (guardado) {
        return guardado !== limpio;
    });

    localStorage.setItem(CLAVE_CUENTAS_ELIMINADAS, JSON.stringify(lista));
}
