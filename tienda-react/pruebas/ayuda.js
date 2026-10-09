// Utilidades para las pruebas: montar un componente y simular
// lo que haria una persona (escribir en un campo, hacer clic).

import { createRoot } from "react-dom/client";
import { act } from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProveedorCarrito from "../src/contexto/ProveedorCarrito";
import ProveedorCatalogo from "../src/contexto/ProveedorCatalogo";
import ProveedorSesion from "../src/contexto/ProveedorSesion";

// Le avisa a React que estamos en un entorno de pruebas.
// Sin esto, act() funciona igual pero imprime una advertencia.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Monta el componente en un div temporal y devuelve ese div
// para poder revisar que se dibujo dentro.
export function montar(elemento) {
    const contenedor = document.createElement("div");
    document.body.appendChild(contenedor);

    const raiz = createRoot(contenedor);
    act(() => { raiz.render(elemento); });

    contenedor.desmontar = () => {
        act(() => { raiz.unmount(); });
        contenedor.remove();
    };

    return contenedor;
}

// Igual que montar, pero dentro de un router de prueba.
// Hace falta para los componentes que usan <Link>.
export function montarConRouter(elemento) {
    return montar(<MemoryRouter>{elemento}</MemoryRouter>);
}

// Para las paginas de la tienda: router + catalogo + carrito.
// Parte con el carrito vacio y el catalogo inicial, y los limpia al terminar.
export function montarEnTienda(elemento, carritoInicial = null) {
    localStorage.removeItem("carritoVolcan");
    localStorage.removeItem("productosSistema");
    localStorage.removeItem("usuarioActivo");

    if (carritoInicial) {
        localStorage.setItem(
            "carritoVolcan",
            JSON.stringify(carritoInicial)
        );
    }

    const contenedor = montar(
        <MemoryRouter>
            <ProveedorSesion>
                <ProveedorCatalogo>
                    <ProveedorCarrito>
                        {elemento}
                    </ProveedorCarrito>
                </ProveedorCatalogo>
            </ProveedorSesion>
        </MemoryRouter>
    );

    const desmontarOriginal = contenedor.desmontar;

    contenedor.desmontar = () => {
        desmontarOriginal();
        localStorage.removeItem("carritoVolcan");
        localStorage.removeItem("productosSistema");
        localStorage.removeItem("usuarioActivo");
    };

    return contenedor;
}
// Escribe un texto en un input o textarea, como si lo tipeara una persona.
// React escucha el evento "input" para disparar su onChange.
export function escribir(campo, texto) {
    const prototipo = Object.getPrototypeOf(campo);
    const asignar = Object.getOwnPropertyDescriptor(prototipo, "value").set;

    act(() => {
        asignar.call(campo, texto);
        campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
}

// Hace clic en un elemento.
export function clic(elemento) {
    act(() => { elemento.click(); });
}

// Para probar una pagina en una direccion, con todos los proveedores.
//   url:     direccion inicial, por ejemplo "/producto/CL002"
//   rutas:   { "/producto/:codigo": <DetalleProducto /> , ... }
//   opciones.usuario: la pagina parte con esa sesion iniciada
//   opciones.carrito: la pagina parte con ese carrito, por ejemplo [{ codigo: "CL001", cantidad: 2 }]
// Parte con todo limpio y lo limpia al terminar.
const CLAVES_TIENDA = [
    "carritoVolcan", "productosSistema", "usuarioActivo",
    "usuariosSistema", "cuentasEliminadas", "pedidos_volcan"
];

export function montarEnRuta(url, rutas, opciones = {}) {
    CLAVES_TIENDA.forEach((clave) => localStorage.removeItem(clave));

    if (opciones.usuario) {
        localStorage.setItem("usuarioActivo", JSON.stringify(opciones.usuario));
    }

    if (opciones.carrito) {
        localStorage.setItem("carritoVolcan", JSON.stringify(opciones.carrito));
    }

    const contenedor = montar(
        <MemoryRouter initialEntries={[url]}>
            <ProveedorSesion>
                <ProveedorCatalogo>
                    <ProveedorCarrito>
                        <Routes>
                            {Object.keys(rutas).map((ruta) => (
                                <Route key={ruta} path={ruta} element={rutas[ruta]} />
                            ))}
                            {/* Para saber cuando una pagina nos manda al login */}
                            <Route path="/login" element={<p id="paginaLogin">Login</p>} />
                        </Routes>
                    </ProveedorCarrito>
                </ProveedorCatalogo>
            </ProveedorSesion>
        </MemoryRouter>
    );

    const desmontarOriginal = contenedor.desmontar;
    contenedor.desmontar = () => {
        desmontarOriginal();
        CLAVES_TIENDA.forEach((clave) => localStorage.removeItem(clave));
    };

    return contenedor;
}
