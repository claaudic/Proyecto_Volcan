import { IMAGEN_RESPALDO } from '../datos/productos'

export function usarImagenRespaldo(evento) {
  if (evento.currentTarget.src.endsWith(IMAGEN_RESPALDO)) {
    return
  }

  evento.currentTarget.src = IMAGEN_RESPALDO
}
