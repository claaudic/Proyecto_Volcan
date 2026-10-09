import { describe, it, expect, vi } from "vitest";
import {
    crearProducto,
    editarProducto,
    cambiarEstadoProducto,
    eliminarProducto,
    descontarStock,
    productosActivos,
    leerCatalogo
} from "./catalogo";
import { imagenDe, PRODUCTOS } from "./productos";

// Pruebas del CRUD del catalogo: lo que va a usar el panel de administracion.
// Se trabaja sobre una lista chica de ejemplo, para que cada caso sea claro.

describe("Catálogo: operaciones", () => {

    const LISTA = [
        { id: 1, codigo: "CL001", nombre: "Cilindro 5 kg", stock: 80, activo: true },
        { id: 2, codigo: "AC003", nombre: "Detector de gas", stock: 8, activo: true }
    ];

    it("crea un producto nuevo con el siguiente id", () => {
        const resultado = crearProducto(LISTA, { codigo: "rg009", nombre: "Regulador nuevo", stock: 5 });

        expect(resultado.ok).toBe(true);
        expect(resultado.productos.length).toBe(3);
        expect(resultado.productos[2].codigo).toBe("RG009");
        expect(resultado.productos[2].id).toBe(3);
    });

    it("no deja crear un producto con un código que ya existe", () => {
        const resultado = crearProducto(LISTA, { codigo: "CL001", nombre: "Repetido" });

        expect(resultado.ok).toBe(false);
        expect(resultado.productos).toBe(LISTA);
    });

    it("edita los datos de un producto sin cambiar su código", () => {
        const editados = editarProducto(LISTA, "CL001", { nombre: "Cilindro GLP 5 kg", codigo: "OTRO" });

        expect(editados[0].nombre).toBe("Cilindro GLP 5 kg");
        expect(editados[0].codigo).toBe("CL001");
    });

    it("un producto desactivado sale de la tienda", () => {
        const cambiados = cambiarEstadoProducto(LISTA, "AC003");

        expect(productosActivos(cambiados).map((p) => p.codigo)).toEqual(["CL001"]);
    });

    it("elimina un producto", () => {
        expect(eliminarProducto(LISTA, "CL001").map((p) => p.codigo)).toEqual(["AC003"]);
    });

    it("descuenta el stock y nunca lo deja en negativo", () => {
        const despues = descontarStock(LISTA, [
            { codigo: "CL001", cantidad: 3 },
            { codigo: "AC003", cantidad: 50 }
        ]);

        expect(despues[0].stock).toBe(77);
        expect(despues[1].stock).toBe(0);
    });

});

describe("Catálogo: imágenes", () => {

    it("usa la imagen guardada en el producto si existe", () => {
        const producto = {
            codigo: "PR999",
            imagen: "img/producto-nuevo.jpg"
        };

        expect(imagenDe(producto)).toBe("/img/producto-nuevo.jpg");
    });

    it("mantiene la imagen antigua basada en el código si no hay imagen guardada", () => {
        const producto = {
            codigo: "CL001",
            imagen: ""
        };

        expect(imagenDe(producto)).toBe("/img/cl001.jpg");
    });

});

describe("Catálogo: persistencia con mocks", () => {

    it("parte desde el catálogo inicial si lo guardado está dañado", () => {
        vi.spyOn(Storage.prototype, "getItem").mockReturnValue("{ dañado");

        expect(leerCatalogo()).toBe(PRODUCTOS);
    });

});
