import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Piedras de la veta. */
export const MINE_ROCKS = 6

/** Lo que el minero tiene que anunciar al terminar. */
export const MINE_MESSAGE = `He picado ${MINE_ROCKS} piedras`

export interface MineState {
  /** Piedras que siguen en la veta. */
  rocks: number
  /** Piedras picadas, que es la cuenta que lleva el alumno. */
  picadas: number
}

export function createMine(): MineState {
  return { rocks: MINE_ROCKS, picadas: 0 }
}

/** API del nivel: la veta se consulta con hay_piedra() y se pica con picar(). */
export function createMineApi(state: MineState): Api {
  return {
    hay_piedra: () => state.rocks > 0,
    picar() {
      if (state.rocks <= 0) {
        throw new ApiError('La veta está agotada: aquí ya no queda piedra que picar')
      }
      state.rocks -= 1
      state.picadas += 1
    },
  }
}

export function judgeMine(
  state: MineState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  if (state.rocks > 0) {
    return {
      complete: false,
      missing:
        state.picadas === 0
          ? 'La veta sigue entera: pica con picar() mientras hay_piedra() sea True.'
          : `Quedan ${state.rocks} piedras en la veta: el while tiene que seguir mientras hay_piedra() sea True.`,
    }
  }

  const message = output.at(-1) ?? ''
  if (message !== MINE_MESSAGE) {
    return {
      complete: false,
      missing: `El minero dice «${message === '' ? 'nada' : message}»; tiene que decir «${MINE_MESSAGE}».`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: un fotograma por piedra picada. */
export function mineSteps(state: MineState): SceneStep[] {
  return Array.from({ length: state.picadas + 1 }, (_, index) => ({
    kind: 'mine' as const,
    rocks: MINE_ROCKS - index,
    picadas: index,
  }))
}
