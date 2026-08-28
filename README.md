# Tienda Gas El Volcán

Tienda online para la **Distribuidora de Gas El Volcán**, empresa familiar de Chillán, Región de Ñuble, dedicada a la distribución de gas licuado a domicilio desde 1998.

Los clientes pueden revisar el catálogo, consultar la cobertura de despacho por comuna y armar su pedido. La empresa cuenta con paneles internos para administración y reparto.

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

| Correo | Contraseña | Rol | Destino |
|---|---|---|---|
| `admin@gaselvolcan.cl` | `Admin1234` | Administrador | Panel de administración |
| `repartidor@gaselvolcan.cl` | `Repart123` | Repartidor | Panel de reparto |
| `cliente@gmail.com` | `Clien1234` | Cliente | Tienda |

Son credenciales de demostración. El sistema no maneja datos reales.

**Dominios de correo aceptados:** `@gaselvolcan.cl`, `@duoc.cl`, `@profesor.duoc.cl`, `@gmail.com`

---

## Estructura

```
Proyecto_Volcan/
├── index.html              Inicio
├── productos.html          Catálogo con buscador y filtros
├── nosotros.html           Empresa y zonas de cobertura
├── blogs.html              Guías del gas
├── detalle-blog-1..3.html  Artículos
├── contacto.html           Formulario de contacto
├── login.html              Inicio de sesión
├── repartidor.html         Panel de reparto
├── admin/                  Panel de administración
├── css/                    Hojas de estilo
├── js/                     Lógica de la aplicación
├── img/                    Imágenes del sitio
└── documentos/             Material del caso (no versionado)
```

---

## Estado de las vistas

**Implementadas**

Inicio · Productos · Nosotros · Blogs y sus tres artículos · Contacto · Iniciar sesión · Carrito (panel lateral) · Panel de administración · Panel de reparto

**Pendientes**

- `registro.html` — alta de cliente
- `detalle-producto.html` — ficha completa del producto

---

## Notas técnicas

**Persistencia local.** Los datos viven en el navegador de cada usuario. Los cambios que realiza un usuario no son visibles para otro. Esto es propio de esta etapa del proyecto, que no cuenta con servidor.

**Listas base.** El catálogo y las cuentas de usuario tienen una lista definida en el código. Si el navegador no tiene datos guardados, el sistema recurre a ella. Así la tienda funciona desde la primera visita en cualquier equipo.

**Autenticación.** Se resuelve en el navegador y no constituye una barrera de seguridad real. Es aceptable porque el sistema no maneja datos reales.

---

## Equipo

- Claudia Cardoza
- Nicolás Morales

Proyecto desarrollado para la asignatura **DSY1104 Desarrollo FullStack II**, Duoc UC.
