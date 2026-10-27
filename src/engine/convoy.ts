import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** El tren largo: nueve vagones, con la locomotora delante y el furgón detrás. */
export const TRAIN_FULL: readonly string[] = [
  'locomotora',
  'carbón',
  'madera',
  'agua',
  'ganado',
  'correo',
  'fruta',
  'cemento',
  'furgón',
]

/** Los cuatro vagones de carga del medio: tren[1:5]. */
export const CONVOY_LOADS: readonly string[] = TRAIN_FULL.slice(1, 5)

/**
 * Los tres anuncios, en orden: el convoy tiene cuatro vagones, el furgón no
 * forma parte de él y el cemento sí viaja en el tren entero.
 */
export const CONVOY_MESSAGES: readonly string[] = [
  `Convoy: ${CONVOY_LOADS.length}`,
  'Furgón: False',
  'Cemento: True',
]

export interface ConvoyState {
  /** El convoy formado, si ya se ha entregado. */
  convoy: string[] | null
}

export function createConvoy(): ConvoyState {
  return { convoy: null }
}

/** API del nivel: el convoy se entrega con la lista de vagones cortada. */
export function createConvoyApi(state: ConvoyState): Api {
  return {
    formar(convoy) {
      if (!Array.isArray(convoy) || convoy.some((load) => typeof load !== 'string')) {
        throw new ApiError('formar() espera la lista de vagones del convoy')
      }
      state.convoy = convoy as string[]
    },
  }
}

export function judgeConvoy(
  state: ConvoyState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  if (state.convoy === null) {
    return {
      complete: false,
      missing: 'El convoy no se ha formado todavía: córtalo con una rebanada y entrégalo con formar(convoy).',
    }
  }

  const anuncio = CONVOY_MESSAGES.findIndex((message, index) => output[index] !== message)
  if (anuncio !== -1) {
    return {
      complete: false,
      missing: `El anuncio ${anuncio + 1} no es el esperado: con print() tiene que salir «${CONVOY_MESSAGES[anuncio]}».`,
    }
  }

  const wrong = CONVOY_LOADS.findIndex((load, index) => state.convoy?.[index] !== load)
  if (wrong !== -1 || state.convoy.length !== CONVOY_LOADS.length) {
    return {
      complete: false,
      missing: `El convoy lleva [${state.convoy.join(', ')}] y tiene que llevar [${CONVOY_LOADS.join(', ')}]: son los vagones de la posición 1 a la 5, sin incluirla.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el tren entero y, si ya está, el convoy formado. */
export function convoySteps(state: ConvoyState): SceneStep[] {
  const steps: SceneStep[] = [{ kind: 'convoy', full: [...TRAIN_FULL], convoy: [], formed: false }]

  if (state.convoy !== null) {
    steps.push({ kind: 'convoy', full: [...TRAIN_FULL], convoy: [...state.convoy], formed: true })
  }

  return steps
}
