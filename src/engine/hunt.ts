import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Los monstruos del bosque, con su nivel de peligro, en el mismo orden. */
export const HUNT_MONSTERS: readonly string[] = ['draco', 'ogro', 'hada', 'trol', 'goblin']
export const HUNT_LEVELS: readonly number[] = [3, 8, 2, 9, 7]

/** Los que superan el nivel 5, en el orden en que aparecen. */
export const HUNT_DANGEROUS: readonly string[] = ['ogro', 'trol', 'goblin']

/** Lo que tiene que salir por la consola, en orden. */
export const HUNT_LINES: readonly string[] = ['Peligrosos: 3', "['goblin', 'ogro', 'trol']"]

export interface HuntState {
  caught: string[] | null
}

export function createHunt(): HuntState {
  return { caught: null }
}

/** API del nivel: la jaula recibe la lista de monstruos peligrosos. */
export function createHuntApi(state: HuntState): Api {
  return {
    capturar(monstruos) {
      if (!Array.isArray(monstruos)) {
        throw new ApiError('capturar() espera la lista de monstruos peligrosos')
      }
      state.caught = monstruos.map((monster) => String(monster))
    },
  }
}

export function judgeHunt(
  state: HuntState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  const announced = HUNT_LINES.findIndex((expected, index) => output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${HUNT_LINES[announced]}».`,
    }
  }

  if (output.length < HUNT_LINES.length) {
    return {
      complete: false,
      missing: `Faltan anuncios: el siguiente tiene que ser «${HUNT_LINES[output.length]}».`,
    }
  }

  if (state.caught === null) {
    return {
      complete: false,
      missing: 'La jaula sigue vacía: entrega la lista con capturar(peligrosos).',
    }
  }

  if (state.caught.length !== HUNT_DANGEROUS.length) {
    return {
      complete: false,
      missing: `Hay ${HUNT_DANGEROUS.length} monstruos peligrosos y han llegado ${state.caught.length}: revisa la condición de la comprensión.`,
    }
  }

  const wrong = HUNT_DANGEROUS.findIndex((name, index) => state.caught?.[index] !== name)
  if (wrong !== -1) {
    return {
      complete: false,
      missing: `En la posición ${wrong + 1} tiene que ir «${HUNT_DANGEROUS[wrong]}» y ha llegado «${state.caught[wrong]}».`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: los monstruos y los que van quedando capturados. */
export function huntSteps(state: HuntState): SceneStep[] {
  const monsters = HUNT_MONSTERS.map((name, index) => ({ name, level: HUNT_LEVELS[index]! }))
  const steps: SceneStep[] = [{ kind: 'hunt', monsters, caught: [], done: false }]
  if (state.caught === null) return steps

  state.caught.forEach((_, index) => {
    steps.push({
      kind: 'hunt',
      monsters,
      caught: (state.caught ?? []).slice(0, index + 1),
      done: index === (state.caught?.length ?? 0) - 1,
    })
  })

  return steps
}
