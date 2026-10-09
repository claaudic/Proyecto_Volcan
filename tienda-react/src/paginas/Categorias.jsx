import { Link, useParams } from 'react-router-dom'
import TarjetaProducto from '../components/TarjetaProducto'
import TarjetaCategoria from '../components/TarjetaCategoria'
import { useCarrito } from '../contexto/carritoContexto'
import { useCatalogo } from '../contexto/catalogoContexto'
import { formatearPrecio, imagenDe } from '../datos/productos'
import { agruparPorCategoria } from '../datos/categorias'
import { leerVistos } from '../datos/vistos'
import { abrirPanelCarrito } from '../utilidades/panelCarrito'

// Vista nueva de la EP2 (Figura 4 de las instrucciones).
// Productos sirve para BUSCAR; Categorias sirve para EXPLORAR:
//   /categorias          -> portada con una tarjeta por categoria
//   /categorias/:nombre  -> los productos de una sola categoria

function Categorias() {
  // Si la URL trae el nombre de una categoria, se muestra esa categoria
  const { nombre } = useParams()
  const { activos } = useCatalogo()

  // Solo productos activos: los desactivados no se muestran en la tienda
  const grupos = agruparPorCategoria(activos)

  if (nombre) {
    return <VistaCategoria grupos={grupos} activos={activos} slug={nombre} />
  }

  return (
    <main>
      <Encabezado titulo="Categorías" bajada="Elige una categoría para ver sus productos.">
        <span aria-current="page">Categorías</span>
      </Encabezado>

      <section className="catalogo" aria-label="Categorías de productos">
        <div className="container">
          <ListaCategorias grupos={grupos} />
        </div>
      </section>
    </main>
  )
}

// Los productos de una categoria, con acceso a las demas
function VistaCategoria({ grupos, activos, slug }) {
  const { agregar } = useCarrito()
  const grupo = grupos.find((g) => g.slug === slug)

  function anadirAlCarrito(codigo) {
    const resultado = agregar(codigo, 1)
    if (resultado.ok) {
      abrirPanelCarrito()
    }
    return resultado
  }

  if (!grupo) {
    return (
      <main>
        <section className="catalogo">
          <div className="container">
            <div className="sin-resultados">
              <p className="sin-resultados-titulo">No encontramos esa categoría</p>
              <p>Puede que el nombre no exista o que ya no tenga productos disponibles.</p>
              <Link className="btn btn-secundario" to="/categorias">Ver todas las categorías</Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const otras = grupos.filter((g) => g.slug !== slug)

  // Los vistos se buscan en el catalogo: si un producto se desactiva, no aparece
  const vistos = leerVistos()
    .map((codigo) => activos.find((p) => p.codigo === codigo))
    .filter(Boolean)

  return (
    <main>
      <Encabezado
        titulo={grupo.nombre}
        bajada={grupo.productos.length === 1 ? "1 producto disponible." : grupo.productos.length + " productos disponibles."}
      >
        <Link to="/categorias">Categorías</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{grupo.nombre}</span>
      </Encabezado>

      <section className="catalogo" aria-label={"Productos de " + grupo.nombre}>
        <div className="container">
          <ListaProductos productos={grupo.productos} alAnadir={anadirAlCarrito} />

          {otras.length > 0 && (
            <div className="categorias-otras">
              <h2>Otras categorías</h2>
              <ListaCategorias grupos={otras} />
            </div>
          )}

          {/* Solo aparece si la persona ya abrio algun producto */}
          {vistos.length > 0 && (
            <div className="categorias-otras">
              <h2>Vistos recientemente</h2>
              <ListaProductos productos={vistos} alAnadir={anadirAlCarrito} />
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

// Grilla de tarjetas de producto: la usan la categoria y los vistos
function ListaProductos({ productos, alAnadir }) {
  return (
    <ul className="row g-4 list-unstyled">
      {productos.map((producto) => (
        <li key={producto.codigo} className="col-12 col-sm-6 col-lg-3">
          <TarjetaProducto
            codigo={producto.codigo}
            nombre={producto.nombre}
            categoria={producto.categoria}
            precio={formatearPrecio(producto.precioResidencial)}
            imagen={imagenDe(producto)}
            stock={producto.stock}
            alAnadir={() => alAnadir(producto.codigo)}
          />
        </li>
      ))}
    </ul>
  )
}

// Grilla de tarjetas de categoria. La imagen es la del primer producto.
function ListaCategorias({ grupos }) {
  return (
    <ul className="row g-4 list-unstyled">
      {grupos.map((grupo) => (
        <li key={grupo.slug} className="col-12 col-sm-6 col-lg-3">
          <TarjetaCategoria
            nombre={grupo.nombre}
            imagen={imagenDe(grupo.productos[0])}
            cantidad={grupo.productos.length}
            enlace={"/categorias/" + grupo.slug}
          />
        </li>
      ))}
    </ul>
  )
}

// Encabezado con el monte, igual al del resto del sitio.
// "children" es la ruta de migas despues de "Inicio /".
function Encabezado({ titulo, bajada, children }) {
  return (
    <section className="pagina-encabezado" aria-labelledby="titulo-categorias">
      <div className="encabezado-fondo" aria-hidden="true">
        <span className="luz luz-encabezado-verde"></span>
        <span className="luz luz-encabezado-celeste"></span>
        <span className="encabezado-arco"></span>
      </div>

      <div className="container">
        <nav className="miga" aria-label="Ruta">
          <Link to="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          {children}
        </nav>
        <h1 id="titulo-categorias">{titulo}</h1>
        <p className="pagina-bajada">{bajada}</p>
      </div>

      <svg className="encabezado-monte" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 60 L0 38 L110 22 L214 40 L318 16 L430 36 L536 20 L648 38 L764 18 L876 36 L992 22 L1104 40 L1216 20 L1330 34 L1440 22 L1440 60 Z" />
      </svg>
    </section>
  )
}

export default Categorias
