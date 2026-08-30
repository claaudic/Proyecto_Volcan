    

const listaProductosDestacados =
    document.getElementById("listaProductosDestacados");


const CODIGOS_DESTACADOS = [
    "CL001",
    "CL002",
    "CL003",
    "CL004",
    "RG001",
    "MG004",
    "AC001",
    "AC003"
];






function obtenerProductosPublicos() {

    if (typeof obtenerCatalogoActivo === "function") {
        return obtenerCatalogoActivo();
    }

    const productosGuardados =
        localStorage.getItem("productosSistema");

    if (!productosGuardados) {
        return null;
    }

    try {
        return JSON.parse(productosGuardados);
    }
    catch (error) {
        return null;
    }

}



function formatearPrecioPublico(precio) {

    return Number(precio).toLocaleString(
        "es-CL",
        {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }
    );

}






function mostrarProductosPublicos() {

    if (!listaProductosDestacados) {
        return;
    }


    const productos =
        obtenerProductosPublicos();


    if (!productos) {
        return;
    }


    const destacados =
        CODIGOS_DESTACADOS
            .map(function (codigo) {

                return productos.find(
                    function (producto) {

                        return (
                            producto.codigo === codigo &&
                            producto.activo !== false
                        );

                    }
                );

            })
            .filter(function (producto) {

                return producto !== undefined;

            });


    listaProductosDestacados.innerHTML = "";


    destacados.forEach(function (producto) {

        const elemento =
            document.createElement("li");


        elemento.className =
            "col-12 col-sm-6 col-lg-3";


        elemento.innerHTML = `

            <article class="tarjeta-producto">

                <img
                    src="${imagenProducto(producto)}"
                    onerror="this.src='img/logo.svg'"
                    alt="${producto.nombre}"
                >

                <div class="tarjeta-contenido">

                    <p class="categoria">
                        ${producto.categoria}
                    </p>

                    <h3>
                        ${producto.nombre}
                    </h3>

                    <p class="precio">
                        ${formatearPrecioPublico(
                            producto.precioResidencial
                        )}
                    </p>

                    <a
                        class="btn btn-producto"
                        href="detalle-producto.html?codigo=${producto.codigo}"
                    >
                        Ver producto
                    </a>

                </div>

            </article>

        `;


        listaProductosDestacados.appendChild(
            elemento
        );

    });

}


mostrarProductosPublicos();