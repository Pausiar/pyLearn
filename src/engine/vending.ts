import { ApiError, isApiFunction, type Api } from '../interp/types'
import type { SceneStep } from './scene'

export interface Sale {
  producto: string
  precio: number
  pago: number
}

/** Las tres ventas del día, en orden. */
export const SALES: readonly Sale[] = [
  { producto: 'zumo', precio: 150, pago: 200 },
  { producto: 'galletas', precio: 80, pago: 100 },
  { producto: 'café', precio: 120, pago: 200 },
]

export interface SoldSale extends Sale {
  cambio: number
}

export interface VendingState {
  sold: SoldSale[]
  started: boolean
}

export function createVending(): VendingState {
  return { sold: [], started: false }
}

/** API del nivel: la máquina pide el cambio a la función del alumno en cada venta. */
export function createVendingApi(state: VendingState): Api {
  return {
    maquina(cambio) {
      if (!isApiFunction(cambio)) {
        throw new ApiError('maquina() necesita tu función cambio(precio, pago)')
      }
      if (state.started) {
        throw new ApiError('La máquina ya ha empezado a vender: cada venta se cobra una sola vez')
      }
      state.started = true

      SALES.forEach((sale) => {
        const devuelto = cambio(sale.precio, sale.pago)
        if (typeof devuelto !== 'number') {
          throw new ApiError(
            `cambio() no ha devuelto nada para ${sale.producto}: el cambio se devuelve con return`,
          )
        }

        const esperado = sale.pago - sale.precio
        if (devuelto !== esperado) {
          throw new ApiError(
            `El cambio no cuadra con ${sale.producto}: cuesta ${sale.precio} y pagan ${sale.pago}`,
          )
        }

        state.sold.push({ ...sale, cambio: devuelto })
      })
    },
  }
}

export function judgeVending(state: VendingState): { complete: boolean; missing: string } {
  if (!state.started) {
    return {
      complete: false,
      missing: 'La máquina no ha vendido nada: entrégale tu función con maquina(cambio).',
    }
  }

  if (state.sold.length < SALES.length) {
    return {
      complete: false,
      missing: `Van ${state.sold.length} de ${SALES.length} ventas: la máquina necesita el cambio de las tres.`,
    }
  }

  const wrong = SALES.findIndex(
    (sale, index) => state.sold[index]?.cambio !== sale.pago - sale.precio,
  )
  if (wrong !== -1) {
    const sale = SALES[wrong]!
    return {
      complete: false,
      missing: `A la venta de ${sale.producto} le faltan ${sale.pago - sale.precio - (state.sold[wrong]?.cambio ?? 0)} céntimos de cambio.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el cambio devuelto en cada fotograma, venta a venta. */
export function vendingSteps(state: VendingState): SceneStep[] {
  if (state.sold.length === 0) return [{ kind: 'vending', sales: [], done: false }]

  return state.sold.map((_, index) => ({
    kind: 'vending' as const,
    sales: state.sold.slice(0, index + 1).map((sale) => ({ ...sale })),
    done: index === state.sold.length - 1 && state.sold.length === SALES.length,
  }))
}
