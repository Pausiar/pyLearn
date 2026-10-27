import { ApiError, isApiFunction, type Api } from '../interp/types'
import type { SceneStep } from './scene'

export interface Order {
  sabor: string
  cantidad: number
}

/** El ticket del día: dos sabores con cantidad y uno de una sola pizza. */
export const ORDERS: readonly Order[] = [
  { sabor: 'margarita', cantidad: 3 },
  { sabor: 'barbacoa', cantidad: 2 },
  { sabor: 'anchoas', cantidad: 1 },
]

export interface OvenState {
  /** Cada tanda que sale del horno, en orden. */
  baked: Order[]
  /** El servicio ya ha cantado la tanda de hoy. */
  served: boolean
}

export function createOven(): OvenState {
  return { baked: [], served: false }
}

/** API del nivel: hornear() cuenta pizzas y tanda() llama a la receta del alumno. */
export function createOvenApi(state: OvenState): Api {
  return {
    hornear(sabor, cantidad) {
      if (typeof sabor !== 'string' || sabor === '') {
        throw new ApiError('hornear() necesita el sabor de la pizza, entre comillas')
      }
      if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1) {
        throw new ApiError('hornear() necesita una cantidad entera de pizzas, de una en adelante')
      }
      state.baked.push({ sabor, cantidad })
    },
    tanda(preparar) {
      if (!isApiFunction(preparar)) {
        throw new ApiError('tanda() necesita tu función preparar(sabor, cantidad=1)')
      }
      if (state.served) {
        throw new ApiError('Hoy solo hay una tanda: el servicio ya la ha cantado')
      }
      state.served = true

      ORDERS.forEach((order) => {
        const before = state.baked.length
        if (order.cantidad === 1) preparar(order.sabor)
        else preparar(order.sabor, order.cantidad)

        const baked = state.baked[state.baked.length - 1]
        if (
          state.baked.length !== before + 1 ||
          baked?.sabor !== order.sabor ||
          baked.cantidad !== order.cantidad
        ) {
          throw new ApiError(
            `El horno esperaba ${order.cantidad} de ${order.sabor} y ha recibido otra cosa`,
          )
        }
      })
    },
  }
}

/** Un texto como «3 margaritas» para el juicio y la escena. */
export function describeOrder(order: Order): string {
  return `${order.cantidad} ${order.sabor}`
}

export function judgeOven(state: OvenState): { complete: boolean; missing: string } {
  if (!state.served) {
    return {
      complete: false,
      missing: 'El servicio no ha cantado la tanda: entrégale tu función con tanda(preparar).',
    }
  }

  const wrong = ORDERS.findIndex(
    (order, index) =>
      state.baked[index]?.sabor !== order.sabor || state.baked[index]?.cantidad !== order.cantidad,
  )
  if (wrong !== -1 || state.baked.length !== ORDERS.length) {
    const esperado = ORDERS.map(describeOrder).join(', ')
    return {
      complete: false,
      missing: `El ticket de hoy es ${esperado}.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el ticket y una pizzada más en cada fotograma. */
export function ovenSteps(state: OvenState): SceneStep[] {
  const steps: SceneStep[] = [{ kind: 'oven', baked: [], done: false }]

  state.baked.forEach((_, index) => {
    steps.push({
      kind: 'oven',
      baked: state.baked.slice(0, index + 1).map((order) => ({ ...order })),
      done: index === state.baked.length - 1 && state.served,
    })
  })

  return steps
}
