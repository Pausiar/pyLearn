import { ApiError, type Api } from '../interp/types'

/** El texto exacto que el letrero tiene que mostrar. */
export const SIGN_GOAL = 'ABIERTO NEÓN 24H'

export interface SignState {
  text: string
  lit: boolean
}

export function createSign(): SignState {
  return { text: '', lit: false }
}

/** API del nivel: pintar el letrero. La última llamada es la que queda. */
export function createSignApi(state: SignState): Api {
  return {
    letrero(texto) {
      if (typeof texto !== 'string') {
        throw new ApiError('letrero() necesita un texto entre comillas')
      }
      if (texto.trim() === '') {
        throw new ApiError('El letrero está vacío: escribe algo entre comillas')
      }

      state.text = texto
      state.lit = true
    },
  }
}

export function judgeSign(state: SignState): { complete: boolean; missing: string } {
  if (!state.lit) {
    return { complete: false, missing: 'El letrero sigue apagado. Llama a letrero(texto).' }
  }

  if (state.text === SIGN_GOAL) return { complete: true, missing: '' }

  return {
    complete: false,
    missing: `El letrero dice «${state.text}». Tiene que decir «${SIGN_GOAL}».`,
  }
}
