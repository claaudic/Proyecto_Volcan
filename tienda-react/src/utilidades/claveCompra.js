// Clave única (UUID) para la Idempotency-Key.
// crypto.randomUUID() solo existe en páginas seguras (HTTPS o localhost): en la EC2
// por http no está, así que se arma con crypto.getRandomValues(), que sí existe siempre.
export function nuevaClaveCompra() {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }

    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // versión 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante RFC 4122
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
