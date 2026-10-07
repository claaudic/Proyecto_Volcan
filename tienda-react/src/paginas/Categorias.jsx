import TarjetaProducto from '../components/TarjetaProducto'
import { useCarrito } from '../contexto/carritoContexto'
import { useCatalogo } from '../contexto/catalogoContexto'
import { formatearPrecio, imagenDe } from '../datos/productos'
import { abrirPanelCarrito } from '../utilidades/panelCarrito'

function Categorias() {
    const { productos } = useCatalogo()
    const { agregar } = useCarrito()

    const categorias = [
        'Cilindros de Gas',
        'Reguladores',
        'Mangueras y Conexiones',
        'Accesorios'
    ]

    function anadirAlCarrito(codigo) {
        const resultado = agregar(codigo, 1)

        if (resultado.ok) {
            abrirPanelCarrito()
        }

        return resultado
    }

    return (
        <main className="container py-5">
            <section className="mb-5">
                <h1 className="titulo-seccion">Categorías</h1>

                <p className="text-muted">
                    Encuentra nuestros productos agrupados por tipo.
                </p>
            </section>

            {categorias.map((categoria) => {
                const productosCategoria = productos.filter(
                    (producto) => producto.categoria === categoria
                )

                if (productosCategoria.length === 0) {
                    return null
                }

                return (
                    <section key={categoria} className="mb-5">
                        <h2 className="h3 mb-4">{categoria}</h2>

                        <ul className="row g-4 list-unstyled">
                            {productosCategoria.map((producto) => (
                                <li
                                    key={producto.codigo}
                                    className="col-12 col-sm-6 col-lg-3"
                                >
                                    <TarjetaProducto
                                        codigo={producto.codigo}
                                        nombre={producto.nombre}
                                        categoria={producto.categoria}
                                        precio={formatearPrecio(producto.precioResidencial)}
                                        imagen={imagenDe(producto.codigo)}
                                        stock={producto.stock}
                                        alAnadir={() => anadirAlCarrito(producto.codigo)}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                )
            })}
        </main>
    )
}

export default Categorias