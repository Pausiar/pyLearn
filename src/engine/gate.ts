import { run } from '../interp/run'
import { ApiError, type Api } from '../interp/types'
import type { SceneStep } from './scene'

/** Los tres visitantes del castillo. */
export const GATE_PASSES: readonly string[] = ['A', 'B', 'C']

export interface GateDoor {
  /** Nombre corto para la escena. */
  door: string
  /** Cómo se dice en el enunciado. */
  expected: string
}

export const GATE_DOORS: Record<string, GateDoor> = {
  A: { door: 'grande', expected: 'abrir la puerta grande' },
  B: { door: 'pequeña', expected: 'abrir la puerta pequeña' },
  C: { door: 'sin entrada', expected: 'denegar la entrada' },
}

export interface GateState {
  pass: string
  door: string
}

export function createGate(pass: string): GateState {
  return { pass, door: '' }
}

/** API del nivel: el guardián abre la puerta que le corresponde al pase. */
export function createGateApi(state: GateState): Api {
  return {
    pase: () => state.pass,
    puerta_grande() {
      if (state.pass !== 'A') {
        throw new ApiError(`El pase ${state.pass} no entra por la puerta grande`)
      }
      state.door = GATE_DOORS.A?.door ?? 'grande'
    },
    puerta_pequena() {
      if (state.pass !== 'B') {
        throw new ApiError(`El pase ${state.pass} no entra por la puerta pequeña`)
      }
      state.door = GATE_DOORS.B?.door ?? 'pequeña'
    },
    denegar() {
      if (state.pass === 'A' || state.pass === 'B') {
        throw new ApiError(`El pase ${state.pass} sí puede entrar: no lo dejes fuera`)
      }
      state.door = GATE_DOORS.C?.door ?? 'sin entrada'
    },
  }
}

/**
 * El guardián atiende a los tres pases: el primero ya corrió en la pantalla y
 * aquí se repite el programa con los otros dos.
 */
export function judgeGate(
  first: GateState,
  code: string,
): { complete: boolean; missing: string; steps: SceneStep[] } {
  const results = GATE_PASSES.map((pass, index) => {
    if (index === 0) return { pass, state: first, error: undefined }

    const state = createGate(pass)
    const result = run(code, createGateApi(state))
    return { pass, state, error: result.error }
  })

  const steps: SceneStep[] = [
    {
      kind: 'gate',
      visitors: results.map((entry) => ({
        pass: entry.pass,
        door: entry.state.door === '' ? 'sin respuesta' : entry.state.door,
      })),
    },
  ]

  for (const entry of results) {
    const expected = GATE_DOORS[entry.pass]
    if (!expected || entry.state.door === expected.door) continue

    const detail = entry.error ? ` (${entry.error.message})` : ''
    return {
      complete: false,
      missing: `Con el pase ${entry.pass} hay que ${expected.expected}${detail}.`,
      steps,
    }
  }

  return { complete: true, missing: '', steps }
}
