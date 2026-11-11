import { slugCategoria } from './categorias'

export class ErrorContratoCatalogo extends Error {
  constructor() {
    super('El servidor devolvió un catálogo con formato inesperado.')
    this.name = 'ErrorContratoCatalogo'
  }
}

function exigir(condicion) {
  if (!condicion) throw new ErrorContratoCatalogo()
}
const esObjeto = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor)
const esId = (valor) => Number.isSafeInteger(valor) && valor > 0
const esTexto = (valor) => typeof valor === 'string' && valor.trim().length > 0
const esImporte = (valor) => typeof valor === 'number' && Number.isFinite(valor) && valor >= 0
const esOpcional = (valor, validar) => valor == null || validar(valor)
const esCadena = (valor) => typeof valor === 'string'

export function adaptarCategoria(dto) {
  exigir(esObjeto(dto) && esId(dto.id) && esTexto(dto.nombre)
    && esOpcional(dto.descripcion, esCadena))
  return { ...dto, descripcion: dto.descripcion ?? '', slug: slugCategoria(dto.nombre) }
}

export function adaptarProducto(dto) {
  exigir(esObjeto(dto) && esId(dto.id) && esTexto(dto.codigo) && esTexto(dto.nombre)
    && esImporte(dto.precioResidencial) && esImporte(dto.precioComercial)
    && (dto.precioOferta === null || esImporte(dto.precioOferta))
    && Number.isInteger(dto.stock) && dto.stock >= 0 && typeof dto.activo === 'boolean'
    && esTexto(dto.unidad) && esOpcional(dto.descripcion, esCadena)
    && esOpcional(dto.etiquetaOferta, esCadena) && esOpcional(dto.imagen, esCadena)
    && esOpcional(dto.stockCritico, (stock) => Number.isInteger(stock) && stock >= 0))
  const categoria = adaptarCategoria(dto.categoria)
  return {
    ...dto,
    categoria: categoria.nombre,
    categoriaId: categoria.id,
    categoriaDatos: categoria,
    descripcion: dto.descripcion ?? '',
    etiquetaOferta: dto.etiquetaOferta ?? '',
    imagen: dto.imagen ?? '',
    stockCritico: dto.stockCritico ?? null
  }
}

export function adaptarCatalogo(productosDto, categoriasDto) {
  exigir(Array.isArray(productosDto) && Array.isArray(categoriasDto))
  const categorias = categoriasDto.map(adaptarCategoria)
  const productos = productosDto.map(adaptarProducto)
  exigir(new Set(categorias.map((c) => c.id)).size === categorias.length
    && new Set(productos.map((p) => p.id)).size === productos.length
    && new Set(productos.map((p) => p.codigo)).size === productos.length)
  for (const producto of productos) {
    exigir(categorias.some((categoria) => categoria.id === producto.categoriaId
      && categoria.nombre === producto.categoria))
  }
  return { productos, categorias }
}
