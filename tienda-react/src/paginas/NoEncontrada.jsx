import { Link, useLocation } from 'react-router-dom'

// Pagina 404: se muestra cuando la direccion no coincide con ninguna ruta.
// En App.jsx va al final con path="*", que significa "cualquier otra direccion".

function NoEncontrada() {
  // La direccion que escribio la persona, para mostrarsela
  const { pathname } = useLocation()

  return (
    <main>
      <section className="detalle" aria-labelledby="tituloNoEncontrada">
        <div className="container">
          <div className="detalle-no-encontrado">
            <p className="carrito-vacio-titulo" id="tituloNoEncontrada">Página no encontrada</p>
            <p>
              No existe ninguna página en <code>{pathname}</code>.
              Puede que la dirección esté mal escrita o que la página ya no exista.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
              <Link className="btn btn-principal" to="/">Volver al inicio</Link>
              <Link className="btn btn-secundario" to="/productos">Ver el catálogo</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default NoEncontrada
