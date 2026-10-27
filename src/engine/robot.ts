import { ApiError, isApiFunction, type Api, type ApiFunction } from '../interp/types'
import type { SceneStep } from './scene'

/** Las casillas donde hay valla. */
export const HURDLES: readonly number[] = [2, 5, 8]

/** La casilla de la meta: justo después de la última valla. */
export const TRACK_END: number = (HURDLES[HURDLES.length - 1] ?? 0) + 1

interface Frame {
  position: number
  jumps: number
}

export interface RobotState {
  position: number
  jumps: number
  trick: ApiFunction | null
  ran: boolean
  history: Frame[]
}

export function createRobot(): RobotState {
  return { position: 0, jumps: 0, trick: null, ran: false, history: [] }
}

function save(state: RobotState): void {
  state.history.push({ position: state.position, jumps: state.jumps })
}

/** API del nivel: el robot solo entiende trucos aprendidos, no órdenes sueltas. */
export function createRobotApi(state: RobotState): Api {
  return {
    avanzar() {
      const next = state.position + 1
      if (next > TRACK_END) {
        throw new ApiError('El robot ya está en la meta: no hace falta avanzar más')
      }
      if (HURDLES.includes(next)) {
        throw new ApiError('Hay una valla justo delante: para cruzarla hace falta saltar()')
      }
      state.position = next
      save(state)
    },
    saltar() {
      const next = state.position + 1
      if (!HURDLES.includes(next)) {
        throw new ApiError('Aquí no hay ninguna valla que saltar')
      }
      state.position = next + 1
      state.jumps += 1
      save(state)
    },
    aprender(truco) {
      if (!isApiFunction(truco)) {
        throw new ApiError('aprender() necesita tu función saltar_valla, sin paréntesis')
      }
      state.trick = truco
    },
    correr() {
      const truco = state.trick
      if (truco === null) {
        throw new ApiError('El robot todavía no sabe el truco: enséñaselo con aprender(saltar_valla)')
      }
      if (state.ran) {
        throw new ApiError('El robot ya ha corrido: el truco se aprende una sola vez')
      }
      state.ran = true

      for (const hurdle of HURDLES) {
        truco()
        if (state.position <= hurdle) {
          throw new ApiError(
            `El robot se ha quedado en la casilla ${state.position}: tu truco tiene que cruzar la valla ${hurdle} y seguir`,
          )
        }
      }

      if (state.position < TRACK_END) {
        throw new ApiError('Al robot le falta un paso para llegar a la meta')
      }
    },
  }
}

export function judgeRobot(state: RobotState): { complete: boolean; missing: string } {
  if (state.trick === null) {
    return {
      complete: false,
      missing: 'El robot no ha aprendido nada: enséñale el truco con aprender(saltar_valla).',
    }
  }

  if (!state.ran) {
    return {
      complete: false,
      missing: 'Con el truco aprendido, dale la salida con correr().',
    }
  }

  if (state.jumps < HURDLES.length || state.position < TRACK_END) {
    return {
      complete: false,
      missing: `El robot ha cruzado ${state.jumps} de ${HURDLES.length} vallas y está en la casilla ${state.position}: el truco tiene que avanzar y saltar.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: un fotograma por orden ejecutada, más el estado de la enseñanza. */
export function robotSteps(state: RobotState): SceneStep[] {
  const steps: SceneStep[] = [
    { kind: 'robot', position: 0, jumps: 0, taught: state.trick !== null, run: false },
  ]

  state.history.forEach((frame) => {
    steps.push({
      kind: 'robot',
      position: frame.position,
      jumps: frame.jumps,
      taught: true,
      run: state.ran,
    })
  })

  return steps
}
