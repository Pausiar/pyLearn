import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Lo que pide cada candado, para la pista y para el enunciado. */
export const LOCK_RULES: readonly string[] = [
  'una edad mayor de 12',
  'una altura de 130 o más',
  'las dos cosas a la vez, con and',
]

export interface LocksState {
  open: (boolean | null)[]
}

export function createLocks(): LocksState {
  return { open: [null, null, null] }
}

/** API del nivel: cada candado se abre con una condición booleana. */
export function createLocksApi(state: LocksState): Api {
  return {
    candado(numero, estado) {
      if (typeof numero !== 'number' || !Number.isInteger(numero) || numero < 1 || numero > 3) {
        throw new ApiError('candado() necesita un número de candado del 1 al 3')
      }
      if (typeof estado !== 'boolean') {
        throw new ApiError('candado() espera True o False como segundo valor: pásale una comparación')
      }

      state.open[numero - 1] = estado
    },
  }
}

export function judgeLocks(state: LocksState): { complete: boolean; missing: string } {
  if (state.open.every((value) => value === null)) {
    return {
      complete: false,
      missing: 'La puerta sigue cerrada: prueba los tres candados con candado(numero, condición).',
    }
  }

  const closed = state.open
    .map((value, index) => (value === true ? 0 : index + 1))
    .filter((numero) => numero > 0)

  if (closed.length === 0) return { complete: true, missing: '' }

  const list = closed.join(' y ')
  const what = closed.length === 1 ? 'el candado' : 'los candados'
  return { complete: false, missing: `Sigue cerrado ${what} ${list}.` }
}

export function locksStep(state: LocksState): SceneStep {
  return { kind: 'locks', open: [...state.open] }
}
