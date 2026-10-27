import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** La mochila grande del aventurero. */
export const BACKPACK_ITEMS: readonly string[] = [
  'espada',
  'antorcha',
  'cuerda',
  'escudo',
  'manzana',
  'brújula',
]

/** Lo que pesa cada objeto, en el mismo orden que la mochila. */
export const BACKPACK_WEIGHTS: readonly number[] = [8, 2, 3, 6, 1, 1]

/** El peso máximo de la mochila ligera. */
export const BACKPACK_LIMIT = 3

/** Lo que tiene que llevar la mochila ligera, ya ordenado. */
export const BACKPACK_LIGHT: readonly string[] = ['antorcha', 'brújula', 'cuerda', 'manzana']

/** Lo que anuncia el aventurero al salir. */
export const BACKPACK_MESSAGE = `Ligera: ${BACKPACK_LIGHT.length} objetos`

export interface AdventurerState {
  /** La mochila ligera entregada, si ya ha salido. */
  light: string[] | null
}

export function createAdventurer(): AdventurerState {
  return { light: null }
}

/** API del nivel: el aventurero entrega la mochila ligera antes de salir. */
export function createAdventurerApi(state: AdventurerState): Api {
  return {
    salir(ligera) {
      if (!Array.isArray(ligera) || ligera.some((item) => typeof item !== 'string')) {
        throw new ApiError('salir() espera la lista de la mochila ligera, con sus objetos')
      }
      state.light = ligera as string[]
    },
  }
}

export function judgeAdventurer(
  state: AdventurerState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  if (state.light === null) {
    return {
      complete: false,
      missing: 'El aventurero no ha salido: entrégale la mochila ligera con salir(ligera).',
    }
  }

  const message = output.at(-1) ?? ''
  if (message !== BACKPACK_MESSAGE) {
    return {
      complete: false,
      missing: `El aventurero dice «${message === '' ? 'nada' : message}»; tiene que decir «${BACKPACK_MESSAGE}».`,
    }
  }

  const wrong = BACKPACK_LIGHT.findIndex((item, index) => state.light?.[index] !== item)
  if (wrong !== -1 || state.light.length !== BACKPACK_LIGHT.length) {
    return {
      complete: false,
      missing: `La mochila ligera lleva [${state.light.join(', ')}] y tiene que llevar [${BACKPACK_LIGHT.join(', ')}]: solo los objetos de ${BACKPACK_LIMIT} kilos o menos, y ordenados.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: la mochila grande y, si ya ha salido, la ligera. */
export function adventurerSteps(state: AdventurerState): SceneStep[] {
  const steps: SceneStep[] = [
    { kind: 'adventure', items: [...BACKPACK_ITEMS], weights: [...BACKPACK_WEIGHTS], light: [], done: false },
  ]

  if (state.light !== null) {
    steps.push({
      kind: 'adventure',
      items: [...BACKPACK_ITEMS],
      weights: [...BACKPACK_WEIGHTS],
      light: [...state.light],
      done: true,
    })
  }

  return steps
}
