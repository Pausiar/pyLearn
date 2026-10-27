import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** El cliente responde en orden: primero el precio, luego las barras. */
export const SHOP_ANSWERS: readonly string[] = ['2', '3']
export const SHOP_GOAL = 'Son 6 monedas'

export interface ShopState {
  answers: string[]
  questions: string[]
}

export function createShop(): ShopState {
  return { answers: [...SHOP_ANSWERS], questions: [] }
}

/** API del nivel: un input() simulado que devuelve la respuesta del cliente. */
export function createShopApi(state: ShopState): Api {
  return {
    input(pregunta) {
      if (typeof pregunta !== 'string') {
        throw new ApiError('input() necesita la pregunta entre comillas')
      }
      if (state.answers.length === 0) {
        throw new ApiError('El cliente ya ha respondido todo lo que sabía')
      }

      const answer = state.answers.shift() ?? ''
      state.questions.push(pregunta)
      return answer
    },
  }
}

export function judgeShop(
  state: ShopState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  if (state.questions.length < SHOP_ANSWERS.length) {
    return {
      complete: false,
      missing: 'El cliente espera dos preguntas: el precio y cuántas barras quiere, cada una con input().',
    }
  }

  const message = output.at(-1) ?? ''
  if (message !== SHOP_GOAL) {
    return {
      complete: false,
      missing: `La caja dice «${message === '' ? 'nada' : message}»; tiene que decir «${SHOP_GOAL}».`,
    }
  }

  return { complete: true, missing: '' }
}

export function shopStep(state: ShopState, output: readonly string[]): SceneStep {
  return { kind: 'shop', questions: [...state.questions], message: output.at(-1) ?? '' }
}
