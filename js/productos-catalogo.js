const IMAGENES_CATALOGO = {
    CL001: "img/cl001.jpg",
    CL002: "img/cl002.jpg",
    CL003: "img/cl003.jpg",
    CL004: "img/cl004.jpg",
    RG001: "img/rg001.jpg",
    MG004: "img/mg004.jpg",
    AC001: "img/ac001.jpg",
    AC003: "img/ac003.jpg"
};

const grillaCatalogo = document.getElementById("catalogoProductos");

if (grillaCatalogo) {
    const campoBuscar = document.getElementById("buscarProducto");
    const pildoras = document.querySelectorAll(".pildora");
    const contador = document.getElementById("contadorResultados");
    const sinResultados = document.getElementById("mensajeCatalogo");
    const botonLimpiar = document.getElementById("limpiarFiltros");

    let categoriaActiva = "";

    function normalizarTexto(texto) {
        return String(texto)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "");
    }

    function formatearPrecio(precio) {
        return Number(precio).toLocaleString("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        });
    }

    function imagenDe(producto) {
        if (producto.imagen && producto.imagen.trim() !== "") {
            return producto.imagen.replace("../img/", "img/");
        }

        if (IMAGENES_CATALOGO[producto.codigo]) {
            return IMAGENES_CATALOGO[producto.codigo];
        }

        return "img/logo.svg";
    }

    function etiquetaStock(producto) {
        if (producto.stock === 0) {
            return '<span class="stock stock-agotado">Sin stock</span>';
        }

        if (producto.stock <= 20) {
            return '<span class="stock stock-bajo">Últimas ' + producto.stock + " unidades</span>";
        }

        return '<span class="stock stock-ok">En stock</span>';
    }

    function filtrar() {
        const busqueda = normalizarTexto(campoBuscar.value.trim());
        const productos = obtenerCatalogoActivo();

        return productos.filter(function (producto) {
            if (categoriaActiva !== "" && producto.categoria !== categoriaActiva) {
                return false;
            }

            if (busqueda === "") {
                return true;
            }

            const texto = normalizarTexto(
                producto.nombre + " " + producto.codigo + " " + producto.descripcion + " " + producto.categoria
            );

            return texto.indexOf(busqueda) !== -1;
        });
    }

    function pintar() {
        const productos = filtrar();
        const total = obtenerCatalogoActivo().length;

        grillaCatalogo.innerHTML = productos.map(function (producto) {
            return '<li class="col-12 col-sm-6 col-lg-3">' +
                '<article class="tarjeta-producto">' +
                '<a class="producto-enlace" href="detalle-producto.html?codigo=' + producto.codigo + '">' +
                '<img src="' + imagenDe(producto) + '" alt="' + producto.nombre + '" loading="lazy">' +
                "</a>" +
                '<div class="tarjeta-contenido">' +
                '<p class="categoria">' + producto.categoria + "</p>" +
                "<h3>" + producto.nombre + "</h3>" +
                etiquetaStock(producto) +
                '<p class="precio">' + formatearPrecio(producto.precioResidencial) + "</p>" +
                '<div class="acciones-producto">' +
                '<a class="btn btn-producto" href="detalle-producto.html?codigo=' + producto.codigo + '">Ver</a>' +
                '<button type="button" class="btn btn-anadir" data-codigo="' + producto.codigo + '"' +
                (producto.stock === 0 ? " disabled" : "") + ">Añadir</button>" +
                "</div>" +
                "</div>" +
                "</article>" +
                "</li>";
        }).join("");

        if (productos.length === 0) {
            contador.textContent = "";
            sinResultados.classList.remove("d-none");
        } else {
            sinResultados.classList.add("d-none");
            contador.textContent = productos.length === total
                ? total + " productos"
                : productos.length + " de " + total + " productos";
        }
    }

    campoBuscar.addEventListener("input", pintar);

    pildoras.forEach(function (pildora) {
        pildora.addEventListener("click", function () {
            categoriaActiva = pildora.dataset.categoria;

            pildoras.forEach(function (otra) {
                otra.classList.remove("pildora-activa");
            });

            pildora.classList.add("pildora-activa");
            pintar();
        });
    });

    botonLimpiar.addEventListener("click", function () {
        campoBuscar.value = "";
        categoriaActiva = "";

        pildoras.forEach(function (otra) {
            otra.classList.remove("pildora-activa");
        });

        pildoras[0].classList.add("pildora-activa");
        pintar();
    });

    grillaCatalogo.addEventListener("click", function (evento) {
        const boton = evento.target.closest(".btn-anadir");

        if (!boton) {
            return;
        }

        const resultado = agregarAlCarrito(boton.dataset.codigo, 1);

        boton.textContent = resultado.ok ? "Agregado" : "Sin stock";
        boton.classList.toggle("btn-anadir-listo", resultado.ok);

        window.setTimeout(function () {
            boton.textContent = "Añadir";
            boton.classList.remove("btn-anadir-listo");
        }, 1400);

        if (resultado.ok) {
            if (typeof abrirPanelCarrito === "function") {
                abrirPanelCarrito();
            }
        } else {
            avisar(resultado.mensaje);
        }
    });

    function avisar(texto) {
        let aviso = document.getElementById("avisoCarrito");

        if (!aviso) {
            aviso = document.createElement("div");
            aviso.id = "avisoCarrito";
            aviso.className = "aviso-flotante";
            aviso.setAttribute("role", "status");
            document.body.appendChild(aviso);
        }

        aviso.textContent = texto;
        aviso.classList.add("aviso-visible");

        window.setTimeout(function () {
            aviso.classList.remove("aviso-visible");
        }, 2600);
    }

    pintar();
}
