# Tienda Gas El Volcán · React

Tienda online de la **Distribuidora de Gas El Volcán**, empresa familiar de Chillán, Región de Ñuble. Esta es la versión en **React** del sitio (Evaluación Parcial 2), migrada desde el sitio en HTML de la EP1.

Los clientes revisan el catálogo, consultan si hay reparto en su comuna, compran con una pasarela de pago simulada y siguen sus pedidos desde su perfil. El administrador tiene su panel de trabajo.

---

## Tecnologías

| | |
|---|---|
| Interfaz | React 19 |
| Herramienta de desarrollo | Vite 8 |
| Navegación | React Router 7 |
| Estilos | Bootstrap 5.3.8 · CSS propio · tipografía Figtree |
| Estado compartido | Context de React (carrito, sesión y catálogo) |
| Persistencia | `localStorage` del navegador |
| Pruebas | Jasmine + Karma (Chrome sin ventana) · cobertura con karma-coverage |

---

## Cómo ejecutarlo

Requiere **Node.js** instalado.

```bash
cd tienda-react
npm install      # solo la primera vez: descarga las dependencias
npm run dev      # inicia el sitio en http://localhost:5173
```

Para cerrar el servidor: **Ctrl + C** en la terminal.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el sitio en modo desarrollo |
| `npm test` | Ejecuta las pruebas y muestra la cobertura |
| `npm run lint` | Revisa el código con ESLint |
| `npm run build` | Genera la versión final en `dist/` |

---

## Cuentas de prueba

| Correo | Contraseña | Nombre | Rol | Al iniciar sesión |
|---|---|---|---|---|
| `admin@gaselvolcan.cl` | `Admin1234` | Sofía Pérez | Administrador | Panel de administración |
| `despachadora@gaselvolcan.cl` | `Desp123` | Daniela Fuentes | Despachadora | Tienda |
| `repartidor@gaselvolcan.cl` | `Repart123` | Matías Vera | Repartidor | Tienda |
| `repartidor2@gaselvolcan.cl` | `Repart123` | Rodrigo Peña | Repartidor | Tienda |
| `camila@gmail.com` | `Clien1234` | Camila Rojas | Cliente | Tienda |

También se puede crear una cuenta de cliente nueva desde **Crear cuenta**.

**Dominios de correo aceptados:** `@gaselvolcan.cl`, `@duoc.cl`, `@profesor.duoc.cl`, `@gmail.com`

Son datos de demostración: el sistema no maneja datos reales.

---

## Tarjetas de prueba

El pago usa una **pasarela simulada** (`src/utilidades/pasarela.js`): no se conecta a ningún banco. Valida la tarjeta y responde según estas reglas.

| Número | Resultado |
|---|---|
| `4111 1111 1111 1111` | ✅ Pago aprobado → Compra exitosa |
| `4000 0000 0000 9995` | ❌ Rechazado: fondos insuficientes → Pago rechazado |
| `4000 0000 0000 0002` | ❌ Rechazado por el banco → Pago rechazado |
| Cualquier otra tarjeta válida | ✅ Pago aprobado |

Para todas: **vencimiento** futuro en formato MM/AA (por ejemplo `12/30`), **CVV** de 3 dígitos (por ejemplo `123`) y el nombre del titular.

Reglas de validación:

- **Número:** 16 dígitos que pasen el algoritmo de Luhn (el que usan las tarjetas reales para detectar números mal escritos).
- **Vencimiento:** formato MM/AA y no vencida.
- **CVV:** 3 dígitos.
- **Titular:** solo letras, hasta 50 caracteres.

**Seguridad:** el número completo y el CVV nunca se guardan. Al pedido solo pasan los últimos 4 dígitos (`•••• 1111`).

---

## Páginas

| Ruta | Página |
|---|---|
| `/` | Inicio |
| `/productos` | Catálogo con buscador y filtro por categoría |
| `/producto/:codigo` | Detalle del producto |
| `/categorias` | Categorías |
| `/categorias/:nombre` | Productos de una categoría y vistos recientemente |
| `/nosotros` | Empresa y buscador de cobertura por comuna |
| `/blogs` · `/blogs/1..3` | Guías del gas y sus artículos |
| `/contacto` | Formulario de contacto |
| `/login` · `/registro` | Iniciar sesión · crear cuenta de cliente |
| `/perfil` | Datos de la cuenta, historial de pedidos y baja de la cuenta |
| `/checkout` | Finalizar compra: datos, entrega y pago |
| `/compra-exitosa` · `/pago-rechazado` | Resultado del pago |
| `/admin` | Panel de administración (solo administrador) |
| `/admin/ordenes` | Listado de órdenes (solo administrador) |
| `/admin/productos` | Gestión de productos (solo administrador) |
| `/admin/usuarios` | Gestión de usuarios (solo administrador) |

---

## Estructura

```
tienda-react/
├── index.html           Página base: carga la tipografía y monta React
├── karma.conf.cjs       Configuración de las pruebas
├── public/img/          Imágenes del sitio
├── pruebas/             Pruebas con Jasmine (*.prueba.jsx)
└── src/
    ├── main.jsx         Punto de entrada: router y proveedores de Context
    ├── App.jsx          Navbar, rutas y footer
    ├── components/      Piezas reutilizables (tarjetas, navbar, carrito…)
    ├── contexto/        Context de carrito, sesión y catálogo
    ├── datos/           Fuente de datos simulada y funciones CRUD
    ├── paginas/         Una vista por ruta
    ├── utilidades/      Validaciones, pasarela de pago y ayudas
    └── css/             Estilos del sitio
```

---

## Pruebas

```bash
npm test
```

Hay **72 pruebas** en `pruebas/`: renderizado, props, estado, eventos, las funciones CRUD de los datos, las validaciones de los formularios y el recorrido completo de la compra (pago aprobado y rechazado).

Al terminar, Karma muestra el resumen de cobertura y genera el informe detallado en `cobertura/html/index.html`. El informe mide los archivos que las pruebas cargan.

---

## Notas técnicas

**Persistencia local.** Los datos (carrito, catálogo, cuentas, pedidos y sesión) viven en el `localStorage` de cada navegador. Los cambios de un usuario no los ve otro. Es propio de esta etapa, que no tiene servidor.

**Datos iniciales.** El catálogo y las cuentas base están en `src/datos/`. Si el navegador no tiene datos guardados, el sistema parte desde ahí, así la tienda funciona desde la primera visita.

**Autenticación.** Se resuelve en el navegador y no es una barrera de seguridad real. Es aceptable porque el sistema no maneja datos reales; en la EP3 se moverá al backend.

---

## Equipo

- Claudia Cardoza
- Nicolás Morales

Proyecto desarrollado para la asignatura **DSY1104 Desarrollo FullStack II**, Duoc UC.
