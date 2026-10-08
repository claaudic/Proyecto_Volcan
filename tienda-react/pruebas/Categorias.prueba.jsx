import { MemoryRouter, Routes, Route } from "react-router-dom";
import { montar } from "./ayuda";
import ProveedorCatalogo from "../src/contexto/ProveedorCatalogo";
import ProveedorCarrito from "../src/contexto/ProveedorCarrito";
import Categorias from "../src/paginas/Categorias";
import { slugCategoria, agruparPorCategoria } from "../src/datos/categorias";
import { PRODUCTOS } from "../src/datos/productos";
import { leerVistos, registrarVisto } from "../src/datos/vistos";

// Pruebas de la vista Categorias: las funciones que agrupan
// y las dos vistas (portada y una categoria).

describe("Categorías: datos", () => {

    it("convierte el nombre en un texto apto para la URL", () => {
        expect(slugCategoria("Cilindros de Gas")).toBe("cilindros-de-gas");
        expect(slugCategoria("Mangueras y Conexiones")).toBe("mangueras-y-conexiones");
    });

    it("agrupa los 14 productos en 4 categorías", () => {
        const grupos = agruparPorCategoria(PRODUCTOS);

        expect(grupos.length).toBe(4);
        expect(grupos.reduce((suma, g) => suma + g.productos.length, 0)).toBe(14);
    });

});

describe("Categorías: páginas", () => {

    let pantalla;

    // Monta la pagina en una URL, con las mismas rutas de App
    function abrir(url) {
        localStorage.removeItem("productosSistema");
        localStorage.removeItem("carritoVolcan");

        pantalla = montar(
            <MemoryRouter initialEntries={[url]}>
                <ProveedorCatalogo>
                    <ProveedorCarrito>
                        <Routes>
                            <Route path="/categorias" element={<Categorias />} />
                            <Route path="/categorias/:nombre" element={<Categorias />} />
                        </Routes>
                    </ProveedorCarrito>
                </ProveedorCatalogo>
            </MemoryRouter>
        );
    }

    afterEach(() => {
        pantalla.desmontar();
        localStorage.removeItem("productosVistos");
    });

    it("la portada muestra una tarjeta por categoría", () => {
        abrir("/categorias");

        expect(pantalla.querySelectorAll(".tarjeta-categoria").length).toBe(4);
    });

    it("la vista de una categoría muestra solo sus productos", () => {
        abrir("/categorias/reguladores");

        expect(pantalla.querySelector("h1").textContent).toBe("Reguladores");

        const categorias = Array.from(pantalla.querySelectorAll(".tarjeta-producto:not(.tarjeta-categoria) .categoria"))
            .map((p) => p.textContent);
        expect(categorias.length).toBe(3);
        expect(categorias.every((c) => c === "Reguladores")).toBe(true);

        // Y ofrece las otras 3 categorias
        expect(pantalla.querySelectorAll(".tarjeta-categoria").length).toBe(3);
    });

    it("avisa si la categoría no existe", () => {
        abrir("/categorias/parrillas");

        expect(pantalla.textContent).toContain("No encontramos esa categoría");
    });

    it("muestra los vistos recientemente solo si hay alguno", () => {
        abrir("/categorias/reguladores");
        expect(pantalla.textContent).not.toContain("Vistos recientemente");
        pantalla.desmontar();

        registrarVisto("CL002");
        abrir("/categorias/reguladores");
        expect(pantalla.textContent).toContain("Vistos recientemente");
    });

});

describe("Vistos recientemente", () => {

    afterEach(() => {
        localStorage.removeItem("productosVistos");
    });

    it("pone el último visto primero y no lo repite", () => {
        registrarVisto("CL001");
        registrarVisto("RG001");
        registrarVisto("CL001");

        expect(leerVistos()).toEqual(["CL001", "RG001"]);
    });

    it("guarda como máximo 4 productos", () => {
        ["CL001", "CL002", "CL003", "CL004", "RG001"].forEach(registrarVisto);

        expect(leerVistos()).toEqual(["RG001", "CL004", "CL003", "CL002"]);
    });

});
