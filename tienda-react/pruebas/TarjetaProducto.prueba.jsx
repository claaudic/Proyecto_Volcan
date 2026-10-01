import TarjetaProducto from "../src/components/TarjetaProducto";
import { montar } from "./ayuda";

describe("TarjetaProducto", () => {

    it("muestra el nombre que recibe por props", () => {
        const pantalla = montar(
            <TarjetaProducto
                nombre="Cilindro GLP 15 kg"
                categoria="Cilindros de Gas"
                precio="$16.000"
                imagen="/img/cl003.jpg"
            />
        );

        expect(pantalla.textContent).toContain("Cilindro GLP 15 kg");

        pantalla.desmontar();
    });

});
