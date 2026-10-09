import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import Blogs from './Blogs'
import DetalleBlog1 from './DetalleBlog1'
import DetalleBlog2 from './DetalleBlog2'
import DetalleBlog3 from './DetalleBlog3'
import { renderizar } from '../test/renderizar'

// Pruebas de renderizado de las guias del gas y sus tres articulos

describe('Blogs', () => {

  it('la página de guías muestra su título y enlaza a los tres artículos', () => {
    renderizar(<Blogs />)

    expect(screen.getByRole('heading', { level: 1, name: 'Guías del gas' })).toBeInTheDocument()
    expect(document.querySelector('a[href="/blogs/1"]')).not.toBeNull()
    expect(document.querySelector('a[href="/blogs/2"]')).not.toBeNull()
    expect(document.querySelector('a[href="/blogs/3"]')).not.toBeNull()
  })

  it.each([
    [DetalleBlog1, 'Cómo cambiar tu cilindro de forma segura'],
    [DetalleBlog2, 'Qué cilindro necesitas según tu consumo'],
    [DetalleBlog3, 'Cuándo conviene tener un detector de gas']
  ])('cada artículo muestra su título', (Articulo, titulo) => {
    renderizar(<Articulo />)

    expect(screen.getByRole('heading', { level: 1, name: titulo })).toBeInTheDocument()
  })

})
