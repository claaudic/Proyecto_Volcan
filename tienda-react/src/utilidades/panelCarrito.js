import { Offcanvas } from "bootstrap";

// Abre el panel lateral del carrito desde el codigo, por ejemplo
// justo despues de agregar un producto. Es lo mismo que hacia
// abrirPanelCarrito() en js/carrito-panel.js del sitio en HTML.
export function abrirPanelCarrito() {
  const panel = document.getElementById("panelCarrito");

  if (!panel) {
    return;
  }

  Offcanvas.getOrCreateInstance(panel).show();
}
