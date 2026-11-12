import { describe, it, expect, vi } from 'vitest'
import { pedir, API_URL } from './api'

const responder = (status = 200, datos = { ok: true }) => vi.spyOn(globalThis, 'fetch')
  .mockResolvedValue({ status, ok: status >= 200 && status < 300, json: async () => datos })

describe('pedir: encabezados adicionales compatibles', () => {
  it('mantiene GET sin cuerpo ni encabezados adicionales', async () => {
    const fetch = responder()
    await pedir('/productos')
    expect(fetch).toHaveBeenCalledWith(API_URL + '/productos', { method: 'GET', headers: {}, body: undefined })
  })
  it('transmite Idempotency-Key conservando JWT y Content-Type JSON', async () => {
    const fetch = responder(201)
    await pedir('/boletas', { metodo: 'POST', cuerpo: { detalles: [] }, token: 'token-sintetico',
      encabezados: { 'Idempotency-Key': 'uuid-sintetico', 'Content-Type': 'text/plain' }, estadoEsperado: 201 })
    expect(fetch.mock.calls[0][1]).toEqual({ method: 'POST', body: '{"detalles":[]}',
      headers: { 'idempotency-key': 'uuid-sintetico', 'Content-Type': 'application/json', Authorization: 'Bearer token-sintetico' } })
  })
  it('no modifica el objeto de opciones del consumidor', async () => {
    responder()
    const encabezados = Object.freeze({ 'X-Prueba': 'valor' })
    await pedir('/productos', { encabezados })
    expect(encabezados).toEqual({ 'X-Prueba': 'valor' })
  })
  it('impide reemplazar Authorization mediante encabezados extra', async () => {
    const fetch = responder()
    await expect(pedir('/boletas', { encabezados: { AUTHORIZATION: 'Bearer otro' } })).rejects.toThrow('Authorization')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('conserva 204 para llamadas existentes', async () => {
    responder(204)
    await expect(pedir('/recurso', { metodo: 'DELETE' })).resolves.toBeNull()
  })
  it('permite exigir el HTTP de un contrato sin afectar otras llamadas', async () => {
    responder(200)
    await expect(pedir('/boletas', { estadoEsperado: 201 })).rejects.toMatchObject({ estado: 200 })
  })
})
