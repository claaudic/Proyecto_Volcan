import { describe, it, expect, vi } from "vitest";
import {
    agregarItem,
    cambiarCantidadItem,
    quitarItem,
    detalleDelCarrito,
    guardarCarrito,
    leerCarrito,
    CLAVE_CARRITO
} from "./carrito";

// Pruebas de la LOGICA del carrito (el CRUD) y de su PERSISTENCIA.
// Datos reales del catalogo: CL002 = Cilindro 11 kg, $12.000, stock 200.
//                            AC003 = Detector de gas, $19.990, stock 8.

describe("Carrito: operaciones", () => {

    it("agrega un producto nuevo al carrito vacío", () => {
        const resultado = agregarItem([], "CL002", 2);

        expect(resultado.ok).toBe(true);
        expect(resultado.items).toEqual([{ codigo: "CL002", cantidad: 2 }]);
    });

    it("suma la cantidad si el producto ya estaba", () => {
        const resultado = agregarItem([{ codigo: "CL002", cantidad: 2 }], "CL002", 3);

        expect(resultado.items).toEqual([{ codigo: "CL002", cantidad: 5 }]);
    });

    it("no deja pedir más que el stock disponible", () => {
        // El detector tiene stock 8: pedir 10 debe fallar
        const resultado = agregarItem([], "AC003", 10);

        expect(resultado.ok).toBe(false);
        expect(resultado.items).toEqual([]);
    });

    it("no agrega un producto que no existe", () => {
        const resultado = agregarItem([], "XYZ", 1);

        expect(resultado.ok).toBe(false);
    });

    it("no modifica la lista original, devuelve una nueva", () => {
        const original = [{ codigo: "CL002", cantidad: 1 }];

        cambiarCantidadItem(original, "CL002", 4);

        expect(original[0].cantidad).toBe(1);
    });

    it("quita un producto del carrito", () => {
        const items = [
            { codigo: "CL002", cantidad: 1 },
            { codigo: "AC003", cantidad: 1 }
        ];

        expect(quitarItem(items, "CL002")).toEqual([{ codigo: "AC003", cantidad: 1 }]);
    });

    it("calcula el total y las unidades", () => {
        // 2 × $12.000 + 1 × $19.990 = $43.990, en 3 unidades
        const detalle = detalleDelCarrito([
            { codigo: "CL002", cantidad: 2 },
            { codigo: "AC003", cantidad: 1 }
        ]);

        expect(detalle.total).toBe(43990);
        expect(detalle.unidades).toBe(3);
    });

    it("agrega la imagen del catálogo al detalle sin guardarla en el carrito", () => {
        const catalogo = [
            {
                codigo: "PR999",
                nombre: "Producto nuevo",
                imagen: "img/producto-nuevo.jpg",
                precioResidencial: 1000,
                stock: 4
            }
        ];

        const detalle = detalleDelCarrito([
            { codigo: "PR999", cantidad: 1 }
        ], catalogo);

        expect(detalle.lineas[0].imagen).toBe("img/producto-nuevo.jpg");
    });

});

// Pruebas con MOCKS: reemplazan localStorage por una version falsa,
// para comprobar que el carrito lo usa bien sin escribir de verdad.

describe("Carrito: persistencia con mocks", () => {

    it("guarda el carrito en localStorage como texto JSON", () => {
        // vi.spyOn reemplaza setItem por un espia: registra la llamada pero no guarda nada
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});

        guardarCarrito([{ codigo: "CL002", cantidad: 2 }]);

        expect(Storage.prototype.setItem).toHaveBeenCalledWith(
            CLAVE_CARRITO,
            '[{"codigo":"CL002","cantidad":2}]'
        );
    });

    it("parte vacío si lo guardado está dañado", () => {
        // El falso getItem devuelve un texto que no es JSON valido
        vi.spyOn(Storage.prototype, "getItem").mockReturnValue("esto no es json");

        expect(leerCarrito()).toEqual([]);
    });

});
