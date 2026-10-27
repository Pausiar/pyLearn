import { run } from '../interp/run'
import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

export type Light = 'rojo' | 'verde'

export interface CrossingState {
  light: Light
  crossed: boolean
  waited: boolean
}

export function createCrossing(light: Light): CrossingState {
  return { light, crossed: false, waited: false }
}

/** API del nivel: la luz se consulta y el peatón cruza o espera. */
export function createCrossingApi(state: CrossingState): Api {
  return {
    luz: () => state.light,
    cruzar() {
      if (state.light !== 'verde') {
        throw new ApiError('El peatón no puede cruzar con la luz en rojo')
      }
      state.crossed = true
    },
    esperar() {
      state.waited = true
    },
  }
}

/**
 * El nivel se juzga dos veces: el primer programa corre con la luz en rojo (ya
 * ejecutado por la pantalla) y aquí se repite con la luz en verde, así que solo
 * pasa un programa que decida de verdad según la luz.
 */
export function judgeCrossing(
  first: CrossingState,
  code: string,
): { complete: boolean; missing: string; steps: SceneStep[] } {
  const second = createCrossing('verde')
  const secondResult = run(code, createCrossingApi(second))

  const steps: SceneStep[] = [
    {
      kind: 'crossing',
      redCrossed: first.crossed,
      redWaited: first.waited,
      greenCrossed: second.crossed,
      greenWaited: second.waited,
    },
  ]

  if (!first.waited && !first.crossed) {
    return { complete: false, missing: 'Con la luz en rojo no hiciste nada: llama a esperar().', steps }
  }

  if (!second.crossed) {
    const detail = secondResult.error
      ? `: en la línea ${secondResult.error.line}, ${secondResult.error.message}`
      : ''
    return {
      complete: false,
      missing: `Con la luz en verde el peatón tiene que cruzar${detail}. Decide según luz() con if y else.`,
      steps,
    }
  }

  return { complete: true, missing: '', steps }
}
