// Utilidades para montar un componente React dentro de una prueba.

import { createRoot } from "react-dom/client";
import { act } from "react";

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
