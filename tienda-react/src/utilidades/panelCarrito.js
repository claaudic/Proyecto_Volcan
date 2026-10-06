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

// Cierra el panel. Se usa en los enlaces del panel (como "Pagar"):
// no se puede usar data-bs-dismiss en un <Link>, porque Bootstrap
// cancela el clic de los enlaces y React Router no alcanza a navegar.
export function cerrarPanelCarrito() {
  const panel = document.getElementById("panelCarrito");

  if (!panel) {
    return;
  }

  Offcanvas.getOrCreateInstance(panel).hide();
}
