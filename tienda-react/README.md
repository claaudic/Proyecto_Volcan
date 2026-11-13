# Tienda Gas El Volcán · React

Tienda online de la **Distribuidora de Gas El Volcán**, empresa familiar de Chillán, Región de Ñuble. Es la versión en **React** del sitio (migrada en la EP2) y, desde la **Evaluación Parcial 3**, trabaja con datos reales: se conecta por API REST al backend de microservicios Spring Boot ([gas-volcan-backend](https://github.com/claaudic/gas-volcan-backend)), a través del API Gateway.

Los clientes revisan el catálogo, consultan si hay reparto en su comuna, compran con una pasarela de pago simulada y siguen sus pedidos desde su perfil. El administrador, la despachadora y los repartidores tienen cada uno su panel de trabajo.

---

## Tecnologías

| | |
|---|---|
| Interfaz | React 19 |
| Herramienta de desarrollo | Vite 8 |
| Navegación | React Router 7 |
| Estilos | Bootstrap 5.3.8 · CSS propio · tipografía Figtree |
| Estado compartido | Context de React (carrito, sesión y catálogo) |
| Datos | API REST del backend (MySQL), siempre a través del API Gateway (`/api/v1`) |
| En el navegador | Solo la sesión (token JWT) y el carrito, en `localStorage` |
| Pruebas | Vitest + Testing Library · jsdom (navegador simulado) · cobertura con @vitest/coverage-v8 |

---

## Cómo ejecutarlo

La tienda necesita el **backend encendido**: sin él no hay catálogo, ni sesión, ni pedidos.

**Opción 1 · Todo con Docker (recomendada).** Desde el repositorio `gas-volcan-backend` (los dos repositorios uno al lado del otro):

```bash
cp .env.example .env          # y FRONTEND_CARPETA=../Proyecto_Volcan/tienda-react
docker compose up -d --build  # MySQL, 3 microservicios, Gateway y esta tienda
```

La tienda queda en `http://localhost` y Swagger en `http://localhost:8080/swagger-ui.html`.

**Opción 2 · Modo desarrollo.** Con el backend encendido (Gateway en el puerto 8080) y **Node.js** instalado:

```bash
cd tienda-react
npm install      # solo la primera vez: descarga las dependencias
npm run dev      # inicia el sitio en http://localhost:5173
```

La dirección de la API se toma de `VITE_API_URL` (por defecto `http://localhost:8080/api/v1`). En Docker se compila con `/api/v1` y nginx pasa `/api` al Gateway. Para cerrar el servidor: **Ctrl + C** en la terminal.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el sitio en modo desarrollo |
| `npm test` | Ejecuta las pruebas y queda atento: las repite al guardar un archivo |
| `npm run test:run` | Ejecuta las pruebas una vez |
| `npm run test:coverage` | Ejecuta las pruebas y muestra la cobertura |
| `npm run lint` | Revisa el código con ESLint |
| `npm run build` | Genera la versión final en `dist/` |

---

## Cuentas de prueba

| Correo | Contraseña | Nombre | Rol | Al iniciar sesión |
|---|---|---|---|---|
| `admin@gaselvolcan.cl` | `Admin1234` | Sofía Pérez | Administrador | Panel de administración |
| `despachadora@gaselvolcan.cl` | `Desp123` | Daniela Fuentes | Despachadora | Panel de despacho (`/despacho`) |
| `repartidor@gaselvolcan.cl` | `Repart123` | Matías Vera | Repartidor | Panel de reparto (`/repartidor`) |
| `repartidor2@gaselvolcan.cl` | `Repart123` | Rodrigo Peña | Repartidor | Panel de reparto (`/repartidor`) |
| `camila@gmail.com` | `Clien1234` | Camila Rojas | Cliente | Tienda |

También se puede crear una cuenta de cliente nueva desde **Crear cuenta**.

**Dominios de correo aceptados:** `@gaselvolcan.cl`, `@duoc.cl`, `@profesor.duoc.cl`, `@gmail.com`

Son las cuentas que crea el backend la primera vez (en un servidor público se cambian con `CLAVE_CUENTAS_DEMO`). Son datos de demostración: el sistema no maneja datos reales.

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
| `/ofertas` | Productos en oferta |
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
| `/admin/reportes` | Reportes del sistema (solo administrador) |
| `/admin/productos` | Gestión de productos (solo administrador) |
| `/admin/usuarios` | Gestión de usuarios (solo administrador) |
| `/despacho` | Pedidos del día y asignación a repartidores (solo despachadora) |
| `/repartidor` | Pedidos asignados y marcar entregados (solo repartidor) |

---

## Estructura

```
tienda-react/
├── index.html           Página base: carga la tipografía y monta React
├── vite.config.js       Configuración de Vite y de las pruebas (Vitest)
├── public/img/          Imágenes del sitio
└── src/
    ├── main.jsx         Punto de entrada: router y proveedores de Context
    ├── App.jsx          Navbar, rutas y footer
    ├── components/      Piezas reutilizables (tarjetas, navbar, carrito…)
    ├── contexto/        Context de carrito, sesión y catálogo
    ├── datos/           Fuente de datos simulada y funciones CRUD
    ├── paginas/         Una vista por ruta
    ├── utilidades/      Validaciones, pasarela de pago y ayudas
    ├── test/            Configuración y ayudas de las pruebas
    └── css/             Estilos del sitio
```

---

## Pruebas

```bash
npm run test:run        # una vez
npm test                # queda atento y repite al guardar (Ctrl + C para salir)
npm run test:coverage   # con cobertura
```

Las pruebas usan **Vitest** y corren en **jsdom**, un navegador simulado: no abren un navegador real. Cada archivo de prueba está junto al código que prueba, con el nombre `*.test.jsx` (por ejemplo `src/utilidades/pasarela.test.jsx`). `src/test/setup.js` limpia `localStorage` antes y después de cada prueba para que no se afecten entre sí.

Hay **622 pruebas en 47 archivos**: renderizado, props, estado, eventos, la conexión con la API (simulada con un fetch falso), la sesión y su renovación, las validaciones de los formularios, los paneles de administración, despacho y reparto, y el recorrido completo de la compra (pago aprobado y rechazado).

`npm run test:coverage` muestra la tabla en la terminal y genera el informe detallado en `coverage/index.html`. Se mide todo `src/`, excepto `main.jsx`, la configuración de pruebas y las pruebas mismas. La cobertura total es de **93 % de líneas**, y **cada archivo tiene al menos 80 %**: si alguno baja de ese mínimo, `npm run test:coverage` falla.

---

## Notas técnicas

**Comunicación con el backend.** Todas las llamadas pasan por `src/utilidades/api.js` (`pedir`) y van solo al API Gateway: nunca directo a un microservicio. Las rutas con sesión usan `llamarApi` (agrega `Authorization: Bearer <token>`) y las pantallas que cargan datos usan `useApi`, que muestra "Cargando…" o el mensaje de error que manda el backend.

**Sesión.** `src/contexto/ProveedorSesion.jsx` guarda el token y los datos visibles de la cuenta en `localStorage` (`sesionVolcan`), así la sesión sobrevive a una recarga. Al abrir la app se descarta un token vencido y se confirma la cuenta con `GET /usuarios/yo`. Un minuto antes de que venza (dura 30 minutos) se pide uno nuevo con `POST /auth/renovar`. Si el backend responde 401, la sesión se cierra. El rol, el correo y el id se leen del token firmado, no de datos editables.

**Restricciones por rol.** `src/components/RutaProtegida.jsx` envía al login a quien no tiene sesión y muestra "No tienes permiso" (`SinPermiso.jsx`) a un rol que no corresponde; las rutas están en `App.jsx`. Es una ayuda para la persona: la seguridad real está en el backend, que vuelve a revisar el token y el rol en cada petición (401 / 403).

**Compra.** El pago usa una pasarela simulada. Solo si se aprueba se envía `POST /boletas` con una `Idempotency-Key`, para que un doble clic o un reintento no duplique la boleta. El precio, el total, el stock y la fecha los calcula el backend.

**Cabeceras de seguridad.** En Docker, `nginx.conf` envía una `Content-Security-Policy` que solo permite scripts de la misma dirección (reduce el riesgo de que un XSS lea el token), además de `X-Frame-Options` y `X-Content-Type-Options`.

---

## Equipo

- Claudia Cardoza
- Nicolás Morales

Proyecto desarrollado para la asignatura **DSY1104 Desarrollo FullStack II**, Duoc UC.
