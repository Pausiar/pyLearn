import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

export const ROCKET_TANKS = 7
export const ROCKET_PER_TANK = 12
export const ROCKET_SPENT = 15
/** 7 × 12 − 15 = 69 toneladas. */
export const ROCKET_FUEL = ROCKET_TANKS * ROCKET_PER_TANK - ROCKET_SPENT

export interface RocketState {
  fuel: number | null
}

export function createRocket(): RocketState {
  return { fuel: null }
}

/** API del nivel: la torre recibe las toneladas que calcula el alumno. */
export function createRocketApi(state: RocketState): Api {
  return {
    torre(toneladas) {
      if (typeof toneladas !== 'number') {
        throw new ApiError('La torre espera un número de toneladas')
      }
      if (!Number.isInteger(toneladas)) {
        throw new ApiError('La torre espera toneladas enteras, sin decimales')
      }
      if (toneladas < 0 || toneladas > 1000) {
        throw new ApiError('Esa cantidad de toneladas no cabe en el cohete')
      }

      state.fuel = toneladas
    },
  }
}

export function judgeRocket(state: RocketState): { complete: boolean; missing: string } {
  if (state.fuel === null) {
    return { complete: false, missing: 'La torre sigue esperando: llama a torre(toneladas).' }
  }

  if (state.fuel === ROCKET_FUEL) return { complete: true, missing: '' }

  return {
    complete: false,
    missing: `La torre ha recibido ${state.fuel} toneladas; tienen que ser ${ROCKET_TANKS} × ${ROCKET_PER_TANK} − ${ROCKET_SPENT} = ${ROCKET_FUEL}.`,
  }
}

export function rocketStep(state: RocketState): SceneStep {
  return { kind: 'rocket', fuel: state.fuel ?? 0, sent: state.fuel !== null }
}
