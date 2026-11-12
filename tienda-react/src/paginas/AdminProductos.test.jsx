import { describe, it, expect } from "vitest";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";

import AdminProductos from "./AdminProductos";
import ProveedorCatalogo from "../contexto/ProveedorCatalogo";
import ProveedorSesion from "../contexto/ProveedorSesion";
import { CLAVE_CATALOGO } from "../datos/catalogo";
import { CLAVE_SESION } from "../datos/usuarios";
import { imagenDe, PRODUCTOS } from "../datos/productos";
import { clic, escribir, montar } from "../test/ayuda";
import { guardarSesionDePrueba } from "../test/api";

function seleccionar(campo, valor) {
    const asignar = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(campo),
        "value"
    ).set;

    act(() => {
        asignar.call(campo, valor);
        campo.dispatchEvent(new Event("change", { bubbles: true }));
    });
}

function montarAdminProductos(productos = null) {
    if (productos) localStorage.setItem(CLAVE_CATALOGO, JSON.stringify(productos));
    else localStorage.removeItem(CLAVE_CATALOGO);
    guardarSesionDePrueba({
        nombre: "Sofía Pérez",
        correo: "admin@gaselvolcan.cl",
        rol: "ADMINISTRADOR"
    });

    const pantalla = montar(
        <MemoryRouter>
            <ProveedorSesion>
                <ProveedorCatalogo>
                    <AdminProductos />
                </ProveedorCatalogo>
            </ProveedorSesion>
        </MemoryRouter>
    );

    const desmontarOriginal = pantalla.desmontar;

    pantalla.desmontar = () => {
        desmontarOriginal();
        localStorage.removeItem(CLAVE_CATALOGO);
        localStorage.removeItem(CLAVE_SESION);
    };

    return pantalla;
}

describe("AdminProductos", () => {
    function abrirDescripcion(pantalla, operacion) {
        clic(Array.from(pantalla.querySelectorAll("button"))
            .find(b => operacion === "crear" ? b.textContent.includes("Crear producto") : b.textContent.trim() === "Editar"));
        if (operacion === "crear") {
            escribir(pantalla.querySelector("#codigoProducto"), "DESC255");
            escribir(pantalla.querySelector("#nombreProducto"), "Prueba descripción");
            seleccionar(pantalla.querySelector("#categoriaProducto"), "Accesorios");
            seleccionar(pantalla.querySelector("#unidadProducto"), "Unidad");
            escribir(pantalla.querySelector("#precioResidencialProducto"), "1500");
            escribir(pantalla.querySelector("#precioComercialProducto"), "1200");
            escribir(pantalla.querySelector("#stockProducto"), "7");
        }
        return pantalla.querySelector("#descripcionProducto");
    }

    it.each([["crear", 255], ["crear", 0], ["editar", 255], ["editar", 0]])(
        "%s acepta una descripción de %i caracteres", (operacion, longitud) => {
            const pantalla = montarAdminProductos();
            const campo = abrirDescripcion(pantalla, operacion);
            expect(campo.maxLength).toBe(255);
            const descripcion = "á".repeat(longitud);
            escribir(campo, descripcion);
            const codigo = pantalla.querySelector("#codigoProducto").value;
            clic(pantalla.querySelector("button[type='submit']"));
            const guardados = JSON.parse(localStorage.getItem(CLAVE_CATALOGO));
            expect(guardados.find(p => p.codigo === codigo).descripcion).toBe(descripcion);
            expect(pantalla.querySelector("#descripcionProducto")).toBeNull();
            pantalla.desmontar();
        }
    );

    it.each(["crear", "editar"])("%s rechaza 256 caracteres sin alterar el catálogo ni perder el formulario", operacion => {
        const pantalla = montarAdminProductos();
        const campo = abrirDescripcion(pantalla, operacion);
        const descripcion = "x".repeat(256);
        escribir(campo, descripcion);
        const catalogo = localStorage.getItem(CLAVE_CATALOGO);
        clic(pantalla.querySelector("button[type='submit']"));
        expect(pantalla.textContent).toContain("La descripción no puede superar los 255 caracteres.");
        expect(pantalla.querySelector("#descripcionProducto").value).toBe(descripcion);
        expect(pantalla.querySelector(".modal")).not.toBeNull();
        expect(localStorage.getItem(CLAVE_CATALOGO)).toBe(catalogo);
        pantalla.desmontar();
    });

    it("no recorta una descripción larga existente al abrir ni al rechazar el guardado", () => {
        const descripcion = "x".repeat(256);
        const productos = PRODUCTOS.map((p, i) => i === 0 ? { ...p, descripcion } : p);
        const pantalla = montarAdminProductos(productos);
        const campo = abrirDescripcion(pantalla, "editar");
        expect(campo.value).toBe(descripcion);
        const catalogo = localStorage.getItem(CLAVE_CATALOGO);
        clic(pantalla.querySelector("button[type='submit']"));
        expect(campo.value).toBe(descripcion);
        expect(localStorage.getItem(CLAVE_CATALOGO)).toBe(catalogo);
        expect(pantalla.querySelector(".modal")).not.toBeNull();
        pantalla.desmontar();
    });

    it("abre el formulario en un modal al crear un producto", () => {
        const pantalla = montarAdminProductos();

        const botonCrear = Array.from(pantalla.querySelectorAll("button"))
            .find((boton) => boton.textContent.includes("Crear producto"));

        clic(botonCrear);

        expect(pantalla.querySelector(".modal")).not.toBeNull();
        expect(pantalla.querySelector(".modal-backdrop")).not.toBeNull();
        expect(pantalla.querySelector("#codigoProducto")).not.toBeNull();
        expect(pantalla.querySelector(".modal-footer").textContent)
            .toContain("Cancelar");
        expect(pantalla.querySelector(".modal-footer").textContent)
            .toContain("Agregar producto");

        pantalla.desmontar();
    });

    it("crea y guarda un producto nuevo con imagen personalizada", () => {
        const pantalla = montarAdminProductos();

        const botonCrear = Array.from(pantalla.querySelectorAll("button"))
            .find((boton) => boton.textContent.includes("Crear producto"));

        clic(botonCrear);

        escribir(pantalla.querySelector("#codigoProducto"), "pr999");
        escribir(pantalla.querySelector("#nombreProducto"), "Producto de prueba");
        escribir(pantalla.querySelector("#descripcionProducto"), "Producto creado desde pruebas.");
        seleccionar(pantalla.querySelector("#categoriaProducto"), "Accesorios");
        seleccionar(pantalla.querySelector("#unidadProducto"), "Unidad");
        escribir(pantalla.querySelector("#precioResidencialProducto"), "1500");
        escribir(pantalla.querySelector("#precioComercialProducto"), "1200");
        escribir(pantalla.querySelector("#stockProducto"), "7");
        escribir(pantalla.querySelector("#imagenProducto"), "img/producto-prueba.jpg");

        clic(Array.from(pantalla.querySelectorAll("button"))
            .find((boton) => boton.textContent.includes("Agregar producto")));

        const guardados = JSON.parse(localStorage.getItem(CLAVE_CATALOGO));
        const creado = guardados.find((producto) => producto.codigo === "PR999");

        expect(creado).toBeDefined();
        expect(creado.nombre).toBe("Producto de prueba");
        expect(creado.imagen).toBe("img/producto-prueba.jpg");
        expect(imagenDe(creado)).toBe("/img/producto-prueba.jpg");
        expect(pantalla.textContent).toContain("Producto de prueba");

        pantalla.desmontar();
    });

    it("muestra confirmacion y elimina un producto", () => {
        const pantalla = montarAdminProductos();

        const botonEliminar = Array.from(pantalla.querySelectorAll("button"))
            .find((boton) => boton.textContent.includes("Eliminar"));

        clic(botonEliminar);

        expect(pantalla.querySelector("#titulo-eliminar-producto")).not.toBeNull();
        expect(pantalla.textContent).toContain("Cilindro GLP 5 kg");

        const botonConfirmar = Array.from(pantalla.querySelectorAll("button"))
            .find((boton) => boton.textContent.includes("Sí, eliminar"));

        clic(botonConfirmar);

        const guardados = JSON.parse(localStorage.getItem(CLAVE_CATALOGO));

        expect(guardados.some((producto) => producto.codigo === "CL001"))
            .toBe(false);
        expect(pantalla.querySelector("#titulo-eliminar-producto")).toBeNull();
        expect(pantalla.textContent).not.toContain("Cilindro GLP 5 kg");

        pantalla.desmontar();
    });

});
