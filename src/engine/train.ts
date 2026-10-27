import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Los siete vagones que salen de la estación; el último va vacío. */
export const TRAIN_LOADS: readonly string[] = [
  'carbón',
  'madera',
  'agua',
  'ganado',
  'correo',
  'fruta',
  'vacío',
]

/** La carga que tiene que llevar el vagón vacío. */
export const TRAIN_FIXED = 'carbón'

/** Los tres anuncios de la estación, en orden. */
export const TRAIN_MESSAGES: readonly string[] = [
  `Vagones: ${TRAIN_LOADS.length}`,
  `Primero: ${TRAIN_LOADS[0] ?? ''}`,
  `Último: ${TRAIN_LOADS.at(-1) ?? ''}`,
]

/** El tren que tiene que llegar: los mismos vagones con el último cargado. */
const EXPECTED: readonly string[] = [...TRAIN_LOADS.slice(0, -1), TRAIN_FIXED]

export interface TrainState {
  /** La carga que ha entregado el alumno, si el tren ya ha llegado. */
  loads: string[] | null
}

export function createTrain(): TrainState {
  return { loads: null }
}

/** API del nivel: la estación recibe la lista de vagones tal y como esté. */
export function createTrainApi(state: TrainState): Api {
  return {
    enviar(vagones) {
      if (!Array.isArray(vagones) || vagones.some((load) => typeof load !== 'string')) {
        throw new ApiError('enviar() espera la lista de vagones, con su carga en cada uno')
      }
      state.loads = vagones as string[]
    },
  }
}

export function judgeTrain(
  state: TrainState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  if (state.loads === null) {
    return {
      complete: false,
      missing: 'El tren sigue en la estación: entrégalo con enviar(vagones).',
    }
  }

  const anuncio = TRAIN_MESSAGES.findIndex((message, index) => output[index] !== message)
  if (anuncio !== -1) {
    return {
      complete: false,
      missing: `El anuncio ${anuncio + 1} no es el esperado: con print() tiene que salir «${TRAIN_MESSAGES[anuncio]}».`,
    }
  }

  const { loads } = state
  if (loads.length !== EXPECTED.length) {
    return {
      complete: false,
      missing: `El tren tiene que salir con ${EXPECTED.length} vagones y ha salido con ${loads.length}.`,
    }
  }

  const cargoWrong = EXPECTED.findIndex((load, index) => loads[index] !== load)
  if (cargoWrong !== -1) {
    const position = cargoWrong === EXPECTED.length - 1 ? '-1' : String(cargoWrong)
    return {
      complete: false,
      missing: `El vagón de la posición ${position} lleva «${loads[cargoWrong] ?? 'nada'}» y tiene que llevar «${EXPECTED[cargoWrong]}».`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el tren al salir y, si ya ha llegado, con su carga final. */
export function trainSteps(state: TrainState): SceneStep[] {
  const steps: SceneStep[] = [{ kind: 'train', loads: [...TRAIN_LOADS], sent: false }]
  if (state.loads !== null) steps.push({ kind: 'train', loads: [...state.loads], sent: true })
  return steps
}
