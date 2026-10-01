import TarjetaProducto from "../src/components/TarjetaProducto";
import { montar } from "./ayuda";

// Pruebas de PROPIEDADES: la tarjeta debe mostrar los datos que recibe.

describe("TarjetaProducto", () => {

    let pantalla;

    // Antes de cada prueba se monta una tarjeta nueva con estos datos
    beforeEach(() => {
        pantalla = montar(
            <TarjetaProducto
                nombre="Cilindro GLP 15 kg"
                categoria="Cilindros de Gas"
                precio="$16.000"
                imagen="/img/cl003.jpg"
            />
        );
    });

    // Y despues de cada prueba se retira, para que no queden restos
    afterEach(() => {
        pantalla.desmontar();
    });

    it("muestra el nombre que recibe por props", () => {
        expect(pantalla.textContent).toContain("Cilindro GLP 15 kg");
    });

    it("muestra el precio que recibe por props", () => {
        expect(pantalla.querySelector(".precio").textContent).toBe("$16.000");
    });

});
