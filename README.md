# Tienda Gas El Volcán

Tienda online para la **Distribuidora de Gas El Volcán**, empresa familiar de Chillán, Región de Ñuble, dedicada a la distribución de gas licuado a domicilio desde 1998.

Los clientes pueden revisar el catálogo, consultar la cobertura de despacho por comuna, armar su pedido y seguir su historial desde su perfil. La empresa cuenta con paneles internos para administración, despacho y reparto.

---

## Tecnologías

| | |
|---|---|
| Estructura | HTML5 semántico |
| Estilos | CSS3 con variables · Bootstrap 5.3.8 |
| Lógica | JavaScript sin frameworks |
| Persistencia | `localStorage` del navegador |
| Tipografía | Figtree (Google Fonts) |

Sin instalación, sin dependencias que descargar y sin proceso de compilación.

---

## Cómo ejecutarlo

1. Clonar el repositorio
2. Abrir la carpeta en el editor
3. Levantar un servidor local:
   - **VS Code:** extensión *Live Server* → botón **Go Live**
   - **Terminal:** `python3 -m http.server 8000`
4. Abrir `index.html`

> Conviene usar un servidor local en lugar de abrir el archivo con doble clic. Con `file://` algunos componentes se comportan de forma distinta.

---

## Cuentas de prueba

| Correo | Contraseña | Nombre | Rol | Destino |
|---|---|---|---|---|
| `admin@gaselvolcan.cl` | `Admin1234` | Sofía Pérez | Administrador | Panel de administración |
| `despachadora@gaselvolcan.cl` | `Desp123` | Daniela Fuentes | Despachadora | Panel de despacho |
| `repartidor@gaselvolcan.cl` | `Repart123` | Matías Vera | Repartidor | Panel de reparto |
| `repartidor2@gaselvolcan.cl` | `Repart123` | Rodrigo Peña | Repartidor | Panel de reparto |
| `cliente@gmail.com` | `Clien1234` | Camila Rojas | Cliente | Tienda |

Son credenciales de demostración. El sistema no maneja datos reales.

Todas las cuentas llegan a su perfil desde el círculo con sus iniciales, en la barra superior. Hay dos repartidores para que la asignación de pedidos tenga más de una opción.

**Dominios de correo aceptados:** `@gaselvolcan.cl`, `@duoc.cl`, `@profesor.duoc.cl`, `@gmail.com`

---

## Estructura

```
Proyecto_Volcan/
├── index.html              Inicio
├── productos.html          Catálogo con buscador y filtros
├── detalle-producto.html   Ficha del producto
├── nosotros.html           Empresa y zonas de cobertura
├── blogs.html              Guías del gas
├── detalle-blog-1..3.html  Artículos
├── contacto.html           Formulario de contacto
├── login.html              Inicio de sesión
├── perfil.html             Perfil del usuario y sus pedidos
├── despachadora.html       Panel de despacho
├── repartidor.html         Panel de reparto
├── admin/                  Panel de administración (5 vistas)
├── css/                    Hojas de estilo
├── js/                     Lógica de la aplicación
├── img/                    Imágenes del sitio
└── documentos/             Material del caso (no versionado)
```

---

## Estado de las vistas

**Implementadas**

Inicio · Productos · Detalle del producto · Nosotros · Blogs y sus tres artículos · Contacto · Iniciar sesión · Carrito (panel lateral) · Perfil · Panel de administración · Panel de despacho · Panel de reparto

**Pendientes**

- `registro.html` — alta de cliente

---

## Notas técnicas

**Persistencia local.** Los datos viven en el navegador de cada usuario. Los cambios que realiza un usuario no son visibles para otro. Esto es propio de esta etapa del proyecto, que no cuenta con servidor.

**Listas base.** El catálogo (`js/catalogo.js`), los pedidos (`js/pedidos.js`) y las cuentas de usuario (`js/sesion.js`) tienen una lista definida en el código. Si el navegador no tiene datos guardados, el sistema recurre a ella. Así la tienda y los paneles funcionan desde la primera visita en cualquier equipo, sin depender de que alguien haya usado el sitio antes.

**Un solo origen para los pedidos.** Los tres paneles que muestran pedidos —reparto, despacho y órdenes— leen de `js/pedidos.js`. A esa lista se le suman las compras hechas desde el carrito, y los cambios de estado o de repartidor se guardan en el navegador y se respetan al recargar.

**Piezas compartidas.** El encabezado, las tarjetas de cifras, las tablas y las etiquetas de estado están definidos una sola vez en `css/estilos.css`. Los archivos por vista (`admin.css`, `despachadora.css`, `repartidor.css`) solo contienen lo exclusivo de esa página.

**Autenticación.** Se resuelve en el navegador y no constituye una barrera de seguridad real. Es aceptable porque el sistema no maneja datos reales.

---

## Equipo

- Claudia Cardoza
- Nicolás Morales

Proyecto desarrollado para la asignatura **DSY1104 Desarrollo FullStack II**, Duoc UC.
