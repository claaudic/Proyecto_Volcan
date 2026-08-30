const contenidoDetalle = document.getElementById("detalleContenido");

if (contenidoDetalle) {
    const parametros = new URLSearchParams(window.location.search);
    const codigo = (parametros.get("codigo") || "").toUpperCase();

    const producto = obtenerCatalogoActivo().find(function (item) {
        return item.codigo === codigo;
    });

    if (!producto) {
        document.getElementById("detalleNoEncontrado").classList.remove("d-none");
    } else {
        mostrarProducto(producto);
        mostrarRelacionados(producto);
    }

    function etiquetaStock(stock) {
        if (stock === 0) {
            return '<span class="stock stock-agotado">Sin stock</span>';
        }

        if (stock <= 20) {
            return '<span class="stock stock-bajo">Últimas ' + stock + " unidades</span>";
        }

        return '<span class="stock stock-ok">En stock</span>';
    }

    function mostrarProducto(item) {
        document.title = item.nombre + " | Gas El Volcán";
        document.getElementById("migaProducto").textContent = item.nombre;

        const imagen = document.getElementById("productoImagen");
        imagen.src = imagenProducto(item);
        imagen.alt = item.nombre;
        imagen.onerror = function () {
            imagen.src = IMAGEN_RESPALDO;
        };

        document.getElementById("productoCategoria").textContent = item.categoria;
        document.getElementById("tituloProducto").textContent = item.nombre;
        document.getElementById("productoPrecio").textContent = formatearMonto(item.precioResidencial);
        document.getElementById("productoStock").innerHTML = etiquetaStock(item.stock);
        document.getElementById("productoDescripcion").textContent = item.descripcion;
        document.getElementById("productoCodigo").textContent = item.codigo;
        document.getElementById("productoUnidad").textContent = item.unidad;
        document.getElementById("productoDisponibles").textContent =
            item.stock === 0 ? "Sin stock" : item.stock + " unidades";

        const campo = document.getElementById("cantidadProducto");
        const bajar = document.getElementById("bajarCantidad");
        const subir = document.getElementById("subirCantidad");
        const anadir = document.getElementById("anadirDetalle");
        const aviso = document.getElementById("detalleAviso");

        campo.max = Math.max(1, item.stock);

        if (item.stock === 0) {
            campo.disabled = true;
            bajar.disabled = true;
            subir.disabled = true;
            anadir.disabled = true;
            anadir.textContent = "Sin stock disponible";
        }

        function ajustar(valor) {
            let cantidad = Number(valor) || 1;

            if (cantidad < 1) {
                cantidad = 1;
            }

            if (cantidad > item.stock) {
                cantidad = item.stock;
            }

            campo.value = cantidad;
            bajar.disabled = cantidad <= 1;
            subir.disabled = cantidad >= item.stock;
        }

        bajar.addEventListener("click", function () {
            ajustar(Number(campo.value) - 1);
        });

        subir.addEventListener("click", function () {
            ajustar(Number(campo.value) + 1);
        });

        campo.addEventListener("input", function () {
            ajustar(campo.value);
        });

        anadir.addEventListener("click", function () {
            const resultado = agregarAlCarrito(item.codigo, Number(campo.value));

            if (resultado.ok) {
                aviso.textContent = "";
                aviso.className = "detalle-aviso";

                if (typeof abrirPanelCarrito === "function") {
                    abrirPanelCarrito();
                }
            } else {
                aviso.textContent = resultado.mensaje;
                aviso.className = "detalle-aviso detalle-aviso-error";
            }
        });

        ajustar(1);
        contenidoDetalle.classList.remove("d-none");
    }

    function mostrarRelacionados(item) {
        const relacionados = obtenerCatalogoActivo().filter(function (otro) {
            return otro.categoria === item.categoria && otro.codigo !== item.codigo;
        }).slice(0, 4);

        if (relacionados.length === 0) {
            return;
        }

        document.getElementById("listaRelacionados").innerHTML = relacionados.map(function (otro) {
            return '<li class="col-12 col-sm-6 col-lg-3">' +
                '<article class="tarjeta-producto">' +
                '<a class="producto-enlace" href="detalle-producto.html?codigo=' + otro.codigo + '">' +
                '<img src="' + imagenProducto(otro) + '" alt="' + otro.nombre + '" loading="lazy" onerror="this.src=\'' + IMAGEN_RESPALDO + '\'">' +
                "</a>" +
                '<div class="tarjeta-contenido">' +
                '<p class="categoria">' + otro.categoria + "</p>" +
                "<h3>" + otro.nombre + "</h3>" +
                '<p class="precio">' + formatearMonto(otro.precioResidencial) + "</p>" +
                '<a class="btn btn-producto" href="detalle-producto.html?codigo=' + otro.codigo + '">Ver</a>' +
                "</div>" +
                "</article>" +
                "</li>";
        }).join("");

        document.getElementById("bloqueRelacionados").classList.remove("d-none");
    }
}
