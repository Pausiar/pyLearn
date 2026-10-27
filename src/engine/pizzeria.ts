import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** La cola con la que empieza el día. */
export const PIZZA_START: readonly string[] = ['barbacoa', 'margarita', 'cuatro quesos']

/** La pizza que sale del horno antes de tiempo. */
export const PIZZA_SERVED = 'tarta'

/** Lo que tiene que quedar en la cola, ya ordenado: sort() la deja así. */
export const PIZZA_QUEUE: readonly string[] = ['anchoas', 'barbacoa', 'cuatro quesos']

/** Los dos anuncios del final, en orden: la servida y la cola. */
export const PIZZA_MESSAGES: readonly string[] = [
  `Servida: ${PIZZA_SERVED}`,
  `[${PIZZA_QUEUE.map((name) => `'${name}'`).join(', ')}]`,
]

export interface PizzeriaState {
  /** La cola que ha llegado a la cocina, si ya ha llegado. */
  queue: string[] | null
}

export function createPizzeria(): PizzeriaState {
  return { queue: null }
}

/** API del nivel: la cocina recibe la cola de pedidos tal y como queda. */
export function createPizzeriaApi(state: PizzeriaState): Api {
  return {
    cocina(pedidos) {
      if (!Array.isArray(pedidos) || pedidos.some((name) => typeof name !== 'string')) {
        throw new ApiError('cocina() espera la lista de pedidos, con un nombre en cada uno')
      }
      state.queue = pedidos as string[]
    },
  }
}

export function judgePizzeria(
  state: PizzeriaState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  if (state.queue === null) {
    return {
      complete: false,
      missing: 'La cocina no ha recibido la cola: entrégala con cocina(pedidos).',
    }
  }

  if (output[0] !== PIZZA_MESSAGES[0]) {
    return {
      complete: false,
      missing: `En la primera línea hay que anunciar la pizza servida: tiene que salir «${PIZZA_MESSAGES[0]}».`,
    }
  }

  if (output[1] !== PIZZA_MESSAGES[1]) {
    return {
      complete: false,
      missing: `En la segunda línea hay que imprimir la cola ordenada, y tiene que salir ${PIZZA_MESSAGES[1]}.`,
    }
  }

  const wrong = PIZZA_QUEUE.findIndex((name, index) => state.queue?.[index] !== name)
  if (wrong !== -1 || state.queue.length !== PIZZA_QUEUE.length) {
    return {
      complete: false,
      missing: `A la cocina ha llegado [${state.queue.join(', ')}]; tiene que llegar [${PIZZA_QUEUE.join(', ')}].`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: la cola del principio y la que llega a la cocina. */
export function pizzeriaSteps(state: PizzeriaState): SceneStep[] {
  const steps: SceneStep[] = [
    { kind: 'pizzeria', queue: [...PIZZA_START], served: null },
  ]

  if (state.queue !== null) {
    steps.push({ kind: 'pizzeria', queue: [...state.queue], served: PIZZA_SERVED })
  }

  return steps
}
