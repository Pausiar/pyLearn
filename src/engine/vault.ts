import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Contraseñas posibles de la caja: de la 1 a la 6. */
export const VAULT_TRIES = 6

/** La única que abre la caja. */
export const VAULT_SECRET = 4

/** Lo que hay que anunciar al abrirla. */
export const VAULT_MESSAGE = `Abierta con la contraseña ${VAULT_SECRET}`

export interface VaultState {
  /** Contraseñas probadas, en orden. */
  tried: number[]
  opened: boolean
}

export function createVault(): VaultState {
  return { tried: [], opened: false }
}

/** API del nivel: probar() responde True cuando la contraseña es la buena. */
export function createVaultApi(state: VaultState): Api {
  return {
    probar(numero) {
      if (
        typeof numero !== 'number' ||
        !Number.isInteger(numero) ||
        numero < 1 ||
        numero > VAULT_TRIES
      ) {
        throw new ApiError(`probar() necesita una contraseña del 1 al ${VAULT_TRIES}`)
      }
      if (state.tried.includes(numero)) {
        throw new ApiError(`La contraseña ${numero} ya la has probado: no la repitas`)
      }

      state.tried.push(numero)
      const acierto = numero === VAULT_SECRET
      if (acierto) state.opened = true
      return acierto
    },
  }
}

export function judgeVault(
  state: VaultState,
  output: readonly string[],
): { complete: boolean; missing: string } {
  if (!state.opened) {
    if (state.tried.length === 0) {
      return {
        complete: false,
        missing: 'La caja sigue cerrada: prueba las contraseñas con probar(), de la 1 a la 6.',
      }
    }

    const left = VAULT_TRIES - state.tried.length
    return {
      complete: false,
      missing: `La caja sigue cerrada y ${left === 1 ? 'queda 1 contraseña' : `quedan ${left} contraseñas`} por probar: el for tiene que recorrer range(1, 7).`,
    }
  }

  if (state.tried.length > VAULT_SECRET) {
    return {
      complete: false,
      missing: `Has probado ${state.tried.length} contraseñas: al acertar hay que parar con break, bastan ${VAULT_SECRET}.`,
    }
  }

  const message = output.at(-1) ?? ''
  if (message !== VAULT_MESSAGE) {
    return {
      complete: false,
      missing: `La caja está abierta pero nadie lo anuncia: el print() tiene que decir «${VAULT_MESSAGE}».`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: un fotograma por intento, con la caja abierta desde el acierto. */
export function vaultSteps(state: VaultState): SceneStep[] {
  if (state.tried.length === 0) return [{ kind: 'vault', tried: [], opened: false }]

  return state.tried.map((_, index) => {
    const tried = state.tried.slice(0, index + 1)
    return { kind: 'vault' as const, tried, opened: tried.includes(VAULT_SECRET) }
  })
}
