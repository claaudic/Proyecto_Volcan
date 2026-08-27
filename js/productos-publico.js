    

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



const IMAGENES_PRODUCTOS = {

    CL001: "img/cl001.jpg",
    CL002: "img/cl002.jpg",
    CL003: "img/cl003.jpg",
    CL004: "img/cl004.jpg",

    RG001: "img/rg001.jpg",

    MG004: "img/mg004.jpg",

    AC001: "img/ac001.jpg",
    AC003: "img/ac003.jpg"

};



function obtenerProductosPublicos() {

    const productosGuardados =
        localStorage.getItem("productosSistema");


    if (!productosGuardados) {
        return null;
    }


    try {

        return JSON.parse(productosGuardados);

    }
    catch (error) {

        console.error(
            "No se pudieron cargar los productos.",
            error
        );

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



function obtenerImagenProducto(producto) {

    if (
        producto.imagen &&
        producto.imagen.trim() !== ""
    ) {

        return producto.imagen.replace(
            "../img/",
            "img/"
        );

    }


    
    if (IMAGENES_PRODUCTOS[producto.codigo]) {

        return IMAGENES_PRODUCTOS[
            producto.codigo
        ];

    }


    return "img/logo.svg";

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
                    src="${obtenerImagenProducto(producto)}"
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
                        href="#"
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