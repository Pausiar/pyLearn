import { ApiError, isApiFunction, type Api } from '../interp/types'
import type { SceneStep } from './scene'

export type KitchenAction = 'picar' | 'hervir' | 'hornear' | 'servir'

export interface TraceEntry {
  action: KitchenAction
  ingrediente: string
}

/** Los dos platos de hoy. */
export type Plato = 'sopa' | 'tarta'

interface Recipe {
  ingrediente: string
  fuego: 'hervir' | 'hornear'
}

/** Qué ingrediente lleva cada plato y por qué fuego pasa. */
export const RECIPES: Record<Plato, Recipe> = {
  sopa: { ingrediente: 'cebolla', fuego: 'hervir' },
  tarta: { ingrediente: 'manzana', fuego: 'hornear' },
}

/** El servicio de hoy: una sopa, una tarta y otra sopa, en este orden. */
export const SERVICE: readonly { plato: Plato; quien: 'receta' | 'cocinar' }[] = [
  { plato: 'sopa', quien: 'receta' },
  { plato: 'tarta', quien: 'receta' },
  { plato: 'sopa', quien: 'cocinar' },
]

export interface RestaurantState {
  trace: TraceEntry[]
  served: string[]
  picados: Set<string>
  cocinados: Set<string>
  done: boolean
}

export function createRestaurant(): RestaurantState {
  return { trace: [], served: [], picados: new Set(), cocinados: new Set(), done: false }
}

/** API del nivel: la cocina registra cada paso y el maître da la comanda. */
export function createRestaurantApi(state: RestaurantState): Api {
  return {
    picar(ingrediente) {
      if (typeof ingrediente !== 'string' || ingrediente === '') {
        throw new ApiError('picar() necesita el ingrediente, entre comillas')
      }
      if (state.picados.has(ingrediente)) {
        throw new ApiError(`La ${ingrediente} ya está picada: no hay que picarla dos veces`)
      }
      state.picados.add(ingrediente)
      state.trace.push({ action: 'picar', ingrediente })
    },
    hervir(ingrediente) {
      if (typeof ingrediente !== 'string' || !state.picados.has(ingrediente)) {
        throw new ApiError('Antes de hervir hay que picar el ingrediente')
      }
      state.cocinados.add(ingrediente)
      state.trace.push({ action: 'hervir', ingrediente })
    },
    hornear(ingrediente) {
      if (typeof ingrediente !== 'string' || !state.picados.has(ingrediente)) {
        throw new ApiError('Antes de hornear hay que picar el ingrediente')
      }
      state.cocinados.add(ingrediente)
      state.trace.push({ action: 'hornear', ingrediente })
    },
    servir(plato) {
      const pedido = typeof plato === 'string' ? plato : ''
      if (pedido !== 'sopa' && pedido !== 'tarta') {
        throw new ApiError('Hoy se sirve «sopa» o «tarta»')
      }

      const recipe = RECIPES[pedido]
      if (!state.cocinados.has(recipe.ingrediente)) {
        throw new ApiError(`Para la ${pedido} hay que ${recipe.fuego} la ${recipe.ingrediente} antes`)
      }

      state.served.push(pedido)
      state.trace.push({ action: 'servir', ingrediente: pedido })
      state.picados.clear()
      state.cocinados.clear()
    },
    carta(sopa, tarta, cocinar) {
      if (!isApiFunction(sopa) || !isApiFunction(tarta) || !isApiFunction(cocinar)) {
        throw new ApiError('carta() necesita tus tres funciones: sopa, tarta y cocinar')
      }
      if (state.done) throw new ApiError('El servicio de hoy ya ha terminado')

      SERVICE.forEach((order) => {
        if (order.quien === 'cocinar') {
          cocinar(order.plato)
          return
        }

        if (order.plato === 'sopa') sopa(RECIPES.sopa.ingrediente)
        else tarta(RECIPES.tarta.ingrediente)
      })
      state.done = true
    },
  }
}

/** La traza que tiene que dejar un servicio bien hecho. */
export const EXPECTED_TRACE: readonly TraceEntry[] = [
  { action: 'picar', ingrediente: 'cebolla' },
  { action: 'hervir', ingrediente: 'cebolla' },
  { action: 'servir', ingrediente: 'sopa' },
  { action: 'picar', ingrediente: 'manzana' },
  { action: 'hornear', ingrediente: 'manzana' },
  { action: 'servir', ingrediente: 'tarta' },
  { action: 'picar', ingrediente: 'cebolla' },
  { action: 'hervir', ingrediente: 'cebolla' },
  { action: 'servir', ingrediente: 'sopa' },
]

function describe(entry: TraceEntry): string {
  return `${entry.action} ${entry.ingrediente}`
}

export function judgeRestaurant(state: RestaurantState): { complete: boolean; missing: string } {
  if (!state.done) {
    return {
      complete: false,
      missing:
        'El maître no ha dado la comanda: entrégale tus recetas con carta(sopa, tarta, cocinar).',
    }
  }

  const wrong = EXPECTED_TRACE.findIndex(
    (entry, index) =>
      state.trace[index]?.action !== entry.action ||
      state.trace[index]?.ingrediente !== entry.ingrediente,
  )
  if (wrong !== -1) {
    const expected = EXPECTED_TRACE[wrong]!
    const actual = state.trace[wrong]
    return {
      complete: false,
      missing: `El paso ${wrong + 1} de la cocina tiene que ser «${describe(expected)}» y ha sido «${actual ? describe(actual) : 'nada'}».`,
    }
  }

  if (state.trace.length !== EXPECTED_TRACE.length) {
    return {
      complete: false,
      missing: `La cocina ha dado ${state.trace.length} pasos y el servicio necesita ${EXPECTED_TRACE.length}.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: la cocina paso a paso y los platos servidos. */
export function restaurantSteps(state: RestaurantState): SceneStep[] {
  const steps: SceneStep[] = [{ kind: 'restaurant', trace: [], served: [], done: false }]

  state.trace.forEach((_, index) => {
    const seen = state.trace.slice(0, index + 1)
    steps.push({
      kind: 'restaurant',
      trace: seen.map((entry) => ({ ...entry })),
      served: state.served.slice(0, seen.filter((entry) => entry.action === 'servir').length),
      done: index === state.trace.length - 1 && state.done,
    })
  })

  return steps
}
