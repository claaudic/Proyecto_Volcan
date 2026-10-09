import { act } from "react";
import { MemoryRouter } from "react-router-dom";

import AdminProductos from "../src/paginas/AdminProductos";
import ProveedorCatalogo from "../src/contexto/ProveedorCatalogo";
import ProveedorSesion from "../src/contexto/ProveedorSesion";
import { CLAVE_CATALOGO } from "../src/datos/catalogo";
import { CLAVE_SESION } from "../src/datos/usuarios";
import { imagenDe } from "../src/datos/productos";
import { clic, escribir, montar } from "./ayuda";

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

function montarAdminProductos() {
    localStorage.removeItem(CLAVE_CATALOGO);
    localStorage.setItem(
        CLAVE_SESION,
        JSON.stringify({
            nombre: "Sofía Pérez",
            correo: "admin@gaselvolcan.cl",
            rol: "ADMINISTRADOR"
        })
    );

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
