// ==========================================
// PRODUCTOS - ADMINISTRADOR
// GAS EL VOLCÁN
// ==========================================

const CLAVE_PRODUCTOS_SISTEMA = "productosSistema";


// ==========================================
// ELEMENTOS HTML
// ==========================================

const tablaProductos =
    document.getElementById("tablaProductos");

const btnNuevoProducto =
    document.getElementById("btnNuevoProducto");

const formProducto =
    document.getElementById("formProducto");

const productoId =
    document.getElementById("productoId");

const codigoProducto =
    document.getElementById("codigoProducto");

const nombreProducto =
    document.getElementById("nombreProducto");

const descripcionProducto =
    document.getElementById("descripcionProducto");

const categoriaProducto =
    document.getElementById("categoriaProducto");

const unidadProducto =
    document.getElementById("unidadProducto");

const precioResidencialProducto =
    document.getElementById("precioResidencialProducto");

const precioComercialProducto =
    document.getElementById("precioComercialProducto");

const stockProducto =
    document.getElementById("stockProducto");

const stockCriticoProducto =
    document.getElementById("stockCriticoProducto");

const imagenProducto =
    document.getElementById("imagenProducto");


// ERRORES

const errorCodigoProducto =
    document.getElementById("errorCodigoProducto");


const errorDescripcionProducto =
    document.getElementById("errorDescripcionProducto");

const errorNombreProducto =
    document.getElementById("errorNombreProducto");

const errorCategoriaProducto =
    document.getElementById("errorCategoriaProducto");

const errorUnidadProducto =
    document.getElementById("errorUnidadProducto");

const errorPrecioResidencial =
    document.getElementById("errorPrecioResidencial");

const errorPrecioComercial =
    document.getElementById("errorPrecioComercial");

const errorStockProducto =
    document.getElementById("errorStockProducto");


// RESUMEN

const totalProductos =
    document.getElementById("totalProductos");

const productosActivos =
    document.getElementById("productosActivos");

const productosStockCritico =
    document.getElementById("productosStockCritico");


const tituloModalProducto =
    document.getElementById("tituloModalProducto");


const modalProducto = new bootstrap.Modal(
    document.getElementById("modalProducto")
);


// ==========================================
// CATÁLOGO ORIGINAL
// ==========================================

const PRODUCTOS_INICIALES = [

    {
        id: 1,
        codigo: "CL001",
        categoria: "Cilindros de Gas",
        nombre: "Cilindro GLP 5 kg",
        descripcion:
            "Cilindro de gas licuado de petróleo 5 kg. Para uso residencial (cocina, calefacción pequeña).",
        unidad: "Unidad",
        precioResidencial: 6500,
        precioComercial: 6000,
        stock: 80,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 2,
        codigo: "CL002",
        categoria: "Cilindros de Gas",
        nombre: "Cilindro GLP 11 kg",
        descripcion:
            "Cilindro estándar doméstico. El más utilizado en hogares chilenos. Compatible con reguladores estándar.",
        unidad: "Unidad",
        precioResidencial: 12000,
        precioComercial: 11000,
        stock: 200,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 3,
        codigo: "CL003",
        categoria: "Cilindros de Gas",
        nombre: "Cilindro GLP 15 kg",
        descripcion:
            "Cilindro de mayor capacidad para hogares de alto consumo o locales pequeños.",
        unidad: "Unidad",
        precioResidencial: 16000,
        precioComercial: 14500,
        stock: 90,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 4,
        codigo: "CL004",
        categoria: "Cilindros de Gas",
        nombre: "Cilindro GLP 45 kg",
        descripcion:
            "Cilindro industrial. Uso comercial: restaurantes, talleres, calefacción de locales.",
        unidad: "Unidad",
        precioResidencial: 45000,
        precioComercial: 40000,
        stock: 30,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 5,
        codigo: "RG001",
        categoria: "Reguladores",
        nombre: "Regulador doméstico estándar",
        descripcion:
            "Regulador de 1 etapa para cilindros 5, 11 y 15 kg. Presión de salida 28 mbar.",
        unidad: "Unidad",
        precioResidencial: 8990,
        precioComercial: 8200,
        stock: 45,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 6,
        codigo: "RG002",
        categoria: "Reguladores",
        nombre: "Regulador de alta presión",
        descripcion:
            "Regulador para cocinas industriales o equipos de mayor consumo. Presión regulable.",
        unidad: "Unidad",
        precioResidencial: 18990,
        precioComercial: 17000,
        stock: 12,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 7,
        codigo: "RG003",
        categoria: "Reguladores",
        nombre: "Regulador dual (2 salidas)",
        descripcion:
            "Permite conectar dos artefactos simultáneamente al mismo cilindro.",
        unidad: "Unidad",
        precioResidencial: 14990,
        precioComercial: 13500,
        stock: 18,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 8,
        codigo: "MG001",
        categoria: "Mangueras y Conexiones",
        nombre: "Manguera gas 1.5 m",
        descripcion:
            "Manguera flexible homologada. Diámetro interior 9mm. Compatible con reguladores estándar.",
        unidad: "Unidad",
        precioResidencial: 3990,
        precioComercial: 3500,
        stock: 80,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 9,
        codigo: "MG002",
        categoria: "Mangueras y Conexiones",
        nombre: "Manguera gas 3 m",
        descripcion:
            "Manguera larga para instalaciones donde el artefacto está alejado del cilindro.",
        unidad: "Unidad",
        precioResidencial: 6990,
        precioComercial: 6200,
        stock: 50,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 10,
        codigo: "MG003",
        categoria: "Mangueras y Conexiones",
        nombre: "Abrazadera metálica",
        descripcion:
            "Abrazadera de acero para asegurar la conexión manguera-regulador y manguera-artefacto.",
        unidad: "Unidad",
        precioResidencial: 990,
        precioComercial: 800,
        stock: 200,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 11,
        codigo: "MG004",
        categoria: "Mangueras y Conexiones",
        nombre:
            "Kit conexión completo (regulador + manguera 1.5m + abrazaderas)",
        descripcion:
            "Todo lo necesario para instalar un cilindro nuevo.",
        unidad: "Kit",
        precioResidencial: 12990,
        precioComercial: 11500,
        stock: 25,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 12,
        codigo: "AC001",
        categoria: "Accesorios",
        nombre: "Carro porta cilindro 11/15 kg",
        descripcion:
            "Carro metálico con ruedas para transportar cilindros dentro del hogar con seguridad.",
        unidad: "Unidad",
        precioResidencial: 12990,
        precioComercial: 11000,
        stock: 20,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 13,
        codigo: "AC002",
        categoria: "Accesorios",
        nombre: "Tapa protectora para válvula",
        descripcion:
            "Tapa de plástico ABS para proteger la válvula del cilindro durante el transporte.",
        unidad: "Unidad",
        precioResidencial: 1490,
        precioComercial: 1200,
        stock: 60,
        stockCritico: null,
        imagen: "",
        activo: true
    },

    {
        id: 14,
        codigo: "AC003",
        categoria: "Accesorios",
        nombre: "Detector de gas a batería",
        descripcion:
            "Sensor electroquímico. Alarma sonora y visual ante fuga de gas GLP o metano.",
        unidad: "Unidad",
        precioResidencial: 19990,
        precioComercial: 17000,
        stock: 8,
        stockCritico: null,
        imagen: "",
        activo: true
    }

];



function obtenerProductosSistema() {

    const guardados =
        localStorage.getItem(CLAVE_PRODUCTOS_SISTEMA);


    if (guardados) {

        return JSON.parse(guardados);

    }


    guardarProductosSistema(PRODUCTOS_INICIALES);

    return PRODUCTOS_INICIALES;

}



function guardarProductosSistema(productos) {

    localStorage.setItem(
        CLAVE_PRODUCTOS_SISTEMA,
        JSON.stringify(productos)
    );

}



function mostrarProductos() {

    const productos =
        obtenerProductosSistema();


    tablaProductos.innerHTML = "";


    productos.forEach(function (producto) {

        const fila =
            document.createElement("tr");


        let stockHTML =
            producto.stock;


        // ALERTA DE STOCK CRÍTICO

        if (
            producto.stockCritico !== null &&
            producto.stockCritico !== "" &&
            producto.stock <= producto.stockCritico
        ) {

            stockHTML = `

                <span class="badge bg-danger">
                    ${producto.stock}
                </span>

                <small
                    class="d-block text-danger mt-1"
                >
                    Stock crítico
                </small>

            `;

        }


        const estado = producto.activo
            ? `
                <span class="badge bg-success">
                    Activo
                </span>
            `
            : `
                <span class="badge bg-secondary">
                    Inactivo
                </span>
            `;


        fila.innerHTML = `

            <td>
                <strong>
                    ${producto.codigo}
                </strong>
            </td>


            <td>

                <strong>
                    ${producto.nombre}
                </strong>

                <small
                    class="d-block text-muted"
                >
                    ${producto.descripcion}
                </small>

            </td>


            <td>
                ${producto.categoria}
            </td>


            <td>
                ${producto.unidad}
            </td>


            <td>
                ${formatearPrecio(producto.precioResidencial)}
            </td>


            <td>
                ${formatearPrecio(producto.precioComercial)}
            </td>


            <td>
                ${stockHTML}
            </td>


            <td>
                ${estado}
            </td>


            <td>

                <button
                    type="button"
                    class="btn btn-sm btn-outline-primary me-1 mb-1"
                    onclick="editarProducto(${producto.id})"
                >
                    Editar
                </button>


                <button
                    type="button"
                    class="btn btn-sm ${
                        producto.activo
                            ? "btn-outline-warning"
                            : "btn-outline-success"
                    } mb-1"
                    onclick="cambiarEstadoProducto(${producto.id})"
                >

                    ${
                        producto.activo
                            ? "Desactivar"
                            : "Activar"
                    }

                </button>


                <button
                    type="button"
                    class="btn btn-sm btn-outline-danger mb-1"
                    onclick="pedirBorrarProducto(${producto.id})"
                >
                    Eliminar
                </button>

            </td>

        `;


        tablaProductos.appendChild(fila);

    });


    actualizarResumenProductos(productos);

}



function actualizarResumenProductos(productos) {

    const activos =
        productos.filter(function (producto) {

            return producto.activo === true;

        }).length;


    const stockCritico =
        productos.filter(function (producto) {

            return (
                producto.stockCritico !== null &&
                producto.stockCritico !== "" &&
                producto.stock <= producto.stockCritico
            );

        }).length;


    totalProductos.textContent =
        productos.length;

    productosActivos.textContent =
        activos;

    productosStockCritico.textContent =
        stockCritico;

}



btnNuevoProducto.addEventListener(
    "click",
    function () {

        limpiarFormularioProducto();

        tituloModalProducto.textContent =
            "Crear producto";

        modalProducto.show();

    }
);



formProducto.addEventListener(
    "submit",
    function (evento) {

        evento.preventDefault();

        limpiarErroresProducto();


        const id =
            Number(productoId.value);


        const codigo =
            codigoProducto.value
                .trim()
                .toUpperCase();


        const nombre =
            nombreProducto.value.trim();


        const descripcion =
            descripcionProducto.value.trim();


        const categoria =
            categoriaProducto.value;


        const unidad =
            unidadProducto.value;


        const precioResidencial =
            Number(precioResidencialProducto.value);


        const precioComercial =
            Number(precioComercialProducto.value);


        const stock =
            Number(stockProducto.value);


        const stockCriticoValor =
            stockCriticoProducto.value.trim();


        const stockCritico =
            stockCriticoValor === ""
                ? null
                : Number(stockCriticoValor);


        const imagen =
            imagenProducto.value.trim();


        let formularioValido = true;



        if (codigo === "") {

            errorCodigoProducto.textContent =
                "Ingresa el código del producto.";

            formularioValido = false;

        }

        else if (codigo.length < 3) {

            errorCodigoProducto.textContent =
                "El código debe tener al menos 3 caracteres.";

            formularioValido = false;

        }



        if (nombre === "") {

            errorNombreProducto.textContent =
                "Ingresa el nombre del producto.";

            formularioValido = false;

        }

        else if (nombre.length > 100) {

            errorNombreProducto.textContent =
                "El nombre no puede superar los 100 caracteres.";

            formularioValido = false;

        }


        if (descripcion.length > 500) {

            errorDescripcionProducto.textContent =
                "La descripción no puede superar los 500 caracteres.";

            formularioValido = false;

        }



        if (categoria === "") {

            errorCategoriaProducto.textContent =
                "Selecciona una categoría.";

            formularioValido = false;

        }



        if (unidad === "") {

            errorUnidadProducto.textContent =
                "Selecciona una unidad.";

            formularioValido = false;

        }



        if (
            precioResidencialProducto.value === "" ||
            precioResidencial < 0
        ) {

            errorPrecioResidencial.textContent =
                "Ingresa un precio residencial válido.";

            formularioValido = false;

        }


       

        if (
            precioComercialProducto.value === "" ||
            precioComercial < 0
        ) {

            errorPrecioComercial.textContent =
                "Ingresa un precio comercial válido.";

            formularioValido = false;

        }



        if (
            stockProducto.value === "" ||
            stock < 0 ||
            !Number.isInteger(stock)
        ) {

            errorStockProducto.textContent =
                "El stock debe ser un número entero mayor o igual a 0.";

            formularioValido = false;

        }


        if (
            stockCritico !== null &&
            (
                stockCritico < 0 ||
                !Number.isInteger(stockCritico)
            )
        ) {

            alert(
                "El stock crítico debe ser un número entero mayor o igual a 0."
            );

            formularioValido = false;

        }


        if (!formularioValido) {

            return;

        }


        const productos =
            obtenerProductosSistema();



        const codigoExiste =
            productos.some(function (producto) {

                return (
                    producto.codigo.toUpperCase() === codigo &&
                    producto.id !== id
                );

            });


        if (codigoExiste) {

            errorCodigoProducto.textContent =
                "Ya existe un producto con ese código.";

            return;

        }



        if (id) {

            const producto =
                productos.find(function (producto) {

                    return producto.id === id;

                });


            if (!producto) {

                return;

            }


            producto.codigo =
                codigo;

            producto.nombre =
                nombre;

            producto.descripcion =
                descripcion;

            producto.categoria =
                categoria;

            producto.unidad =
                unidad;

            producto.precioResidencial =
                precioResidencial;

            producto.precioComercial =
                precioComercial;

            producto.stock =
                stock;

            producto.stockCritico =
                stockCritico;

            producto.imagen =
                imagen;

        }



        else {

            const nuevoId =
                productos.length > 0
                    ? Math.max(
                        ...productos.map(
                            function (producto) {

                                return producto.id;

                            }
                        )
                    ) + 1
                    : 1;


            const nuevoProducto = {

                id: nuevoId,

                codigo: codigo,

                categoria: categoria,

                nombre: nombre,

                descripcion: descripcion,

                unidad: unidad,

                precioResidencial:
                    precioResidencial,

                precioComercial:
                    precioComercial,

                stock: stock,

                stockCritico:
                    stockCritico,

                imagen: imagen,

                activo: true

            };


            productos.push(
                nuevoProducto
            );

        }


        guardarProductosSistema(
            productos
        );


        mostrarProductos();


        modalProducto.hide();

    }
);



function editarProducto(id) {

    const productos =
        obtenerProductosSistema();


    const producto =
        productos.find(function (producto) {

            return producto.id === id;

        });


    if (!producto) {

        return;

    }


    limpiarFormularioProducto();


    productoId.value =
        producto.id;


    codigoProducto.value =
        producto.codigo;


    nombreProducto.value =
        producto.nombre;


    descripcionProducto.value =
        producto.descripcion;


    categoriaProducto.value =
        producto.categoria;


    unidadProducto.value =
        producto.unidad;


    precioResidencialProducto.value =
        producto.precioResidencial;


    precioComercialProducto.value =
        producto.precioComercial;


    stockProducto.value =
        producto.stock;


    stockCriticoProducto.value =
        producto.stockCritico === null
            ? ""
            : producto.stockCritico;


    imagenProducto.value =
        producto.imagen || "";


    tituloModalProducto.textContent =
        "Editar producto";


    modalProducto.show();

}


function cambiarEstadoProducto(id) {

    const productos =
        obtenerProductosSistema();


    const producto =
        productos.find(function (producto) {

            return producto.id === id;

        });


    if (!producto) {

        return;

    }


    producto.activo =
        !producto.activo;


    guardarProductosSistema(
        productos
    );


    mostrarProductos();

}



function formatearPrecio(precio) {

    return precio.toLocaleString(

        "es-CL",

        {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        }

    );

}


function limpiarFormularioProducto() {

    formProducto.reset();

    productoId.value = "";

    limpiarErroresProducto();

}



function limpiarErroresProducto() {

    errorCodigoProducto.textContent = "";

    errorDescripcionProducto.textContent = "";

    errorNombreProducto.textContent = "";

    errorCategoriaProducto.textContent = "";

    errorUnidadProducto.textContent = "";

    errorPrecioResidencial.textContent = "";

    errorPrecioComercial.textContent = "";

    errorStockProducto.textContent = "";

}


mostrarProductos();


// ==========================================
// ELIMINAR UN PRODUCTO
// ==========================================

let productoABorrar = null;


function pedirBorrarProducto(id) {

    const productos = obtenerProductosSistema();

    const producto = productos.find(function (uno) {
        return uno.id === id;
    });


    if (!producto) {
        return;
    }


    productoABorrar = id;

    document.getElementById("productoABorrar").textContent =
        producto.nombre;

    ventanaBorrarProducto.show();

}


function eliminarProducto(id) {

    const productos = obtenerProductosSistema();

    const quedan = productos.filter(function (producto) {
        return producto.id !== id;
    });

    guardarProductosSistema(quedan);

    mostrarProductos();

}


const ventanaBorrarProducto = new bootstrap.Modal(
    document.getElementById("modalBorrarProducto")
);


document.getElementById("confirmarBorrarProducto")
    .addEventListener("click", function () {

        if (productoABorrar !== null) {
            eliminarProducto(productoABorrar);
        }

        productoABorrar = null;

        ventanaBorrarProducto.hide();

    });
