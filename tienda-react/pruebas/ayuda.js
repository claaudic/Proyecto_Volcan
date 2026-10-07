// Utilidades para las pruebas: montar un componente y simular
// lo que haria una persona (escribir en un campo, hacer clic).

import { createRoot } from "react-dom/client";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import ProveedorCarrito from "../src/contexto/ProveedorCarrito";
import ProveedorCatalogo from "../src/contexto/ProveedorCatalogo";

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
export function montarEnTienda(elemento) {
    localStorage.removeItem("carritoVolcan");
    localStorage.removeItem("productosSistema");

    const contenedor = montar(
        <MemoryRouter>
            <ProveedorCatalogo>
                <ProveedorCarrito>{elemento}</ProveedorCarrito>
            </ProveedorCatalogo>
        </MemoryRouter>
    );

    const desmontarOriginal = contenedor.desmontar;
    contenedor.desmontar = () => {
        desmontarOriginal();
        localStorage.removeItem("carritoVolcan");
        localStorage.removeItem("productosSistema");
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
