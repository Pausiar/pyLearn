import { ApiError, type Api } from '../interp/types'

/** Lo que el explorador tiene que llevar. */
export const BACKPACK_GOAL = { ropes: 3, canteens: 2 } as const

/** Total de cosas que caben. */
export const BACKPACK_CAPACITY = 6

export interface BackpackState {
  ropes: number
  canteens: number
  placed: boolean
}

export function createBackpack(): BackpackState {
  return { ropes: 0, canteens: 0, placed: false }
}

function things(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

/** API del nivel: el explorador llena la mochila con dos cantidades. */
export function createBackpackApi(state: BackpackState): Api {
  return {
    mochila(cuerdas, cantimploras) {
      if (typeof cuerdas !== 'number' || typeof cantimploras !== 'number') {
        throw new ApiError('mochila() necesita dos números: las cuerdas y las cantimploras')
      }
      if (!Number.isInteger(cuerdas) || !Number.isInteger(cantimploras)) {
        throw new ApiError('Las cantidades de la mochila tienen que ser números enteros')
      }
      if (cuerdas < 0 || cantimploras < 0) {
        throw new ApiError('No puedes meter cantidades negativas en la mochila')
      }
      if (cuerdas + cantimploras > BACKPACK_CAPACITY) {
        throw new ApiError(`En la mochila solo caben ${BACKPACK_CAPACITY} cosas`)
      }

      state.ropes = cuerdas
      state.canteens = cantimploras
      state.placed = true
    },
  }
}

export function judgeBackpack(state: BackpackState): { complete: boolean; missing: string } {
  if (!state.placed) {
    return {
      complete: false,
      missing: 'La mochila está vacía. Llama a mochila(cuerdas, cantimploras).',
    }
  }

  if (state.ropes === BACKPACK_GOAL.ropes && state.canteens === BACKPACK_GOAL.canteens) {
    return { complete: true, missing: '' }
  }

  return {
    complete: false,
    missing: `La mochila lleva ${things(state.ropes, 'cuerda', 'cuerdas')} y ${things(state.canteens, 'cantimplora', 'cantimploras')}. Tiene que llevar ${BACKPACK_GOAL.ropes} cuerdas y ${BACKPACK_GOAL.canteens} cantimploras.`,
  }
}
