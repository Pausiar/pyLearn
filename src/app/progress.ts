import { LEVEL_COUNT } from '../levels/catalog'
import type { StorageLike } from './storage'

export const PROGRESS_KEY = 'pylearn:v1'
/** La demo guardaba en `pylearn` con la forma { st, lives }. */
export const LEGACY_KEY = 'pylearn'
export const MAX_LIVES = 3
export const MAX_STARS = 3

export interface Progress {
  version: 1
  stars: Record<number, number>
  lives: number
}

export type RunOutcome = { stars: number } | { failed: true }

export function emptyProgress(): Progress {
  return { version: 1, stars: {}, lives: MAX_LIVES }
}

function clampStars(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(MAX_STARS, Math.trunc(numeric)))
}

function clampLives(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return MAX_LIVES
  return Math.max(0, Math.min(MAX_LIVES, Math.trunc(numeric)))
}

function normalizeStars(input: unknown): Record<number, number> {
  const stars: Record<number, number> = {}
  if (!input || typeof input !== 'object') return stars

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const id = Number(key)
    if (!Number.isInteger(id) || id < 1 || id > LEVEL_COUNT) continue
    const count = clampStars(value)
    if (count > 0) stars[id] = count
  }

  return stars
}

/** Acepta la forma v1 y la de la demo. Devuelve null si el texto no es un progreso. */
export function parseProgress(raw: string): Progress | null {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  const starsInput = record.stars ?? record.st
  const livesInput = record.lives
  if (starsInput === undefined && livesInput === undefined) return null

  return {
    version: 1,
    stars: normalizeStars(starsInput),
    lives: clampLives(livesInput ?? MAX_LIVES),
  }
}

export function serializeProgress(progress: Progress): string {
  return JSON.stringify(progress, null, 2)
}

export function loadProgress(storage: StorageLike | null): Progress {
  if (!storage) return emptyProgress()

  try {
    const current = storage.getItem(PROGRESS_KEY)
    if (current) return parseProgress(current) ?? emptyProgress()

    const legacy = storage.getItem(LEGACY_KEY)
    if (legacy) return parseProgress(legacy) ?? emptyProgress()
  } catch {
    // Almacenamiento bloqueado: se juega igual, sin guardar.
  }

  return emptyProgress()
}

export function saveProgress(storage: StorageLike | null, progress: Progress): boolean {
  if (!storage) return false
  try {
    storage.setItem(PROGRESS_KEY, serializeProgress(progress))
    return true
  } catch {
    return false
  }
}

export function totalStars(progress: Progress): number {
  return Object.values(progress.stars).reduce((sum, count) => sum + count, 0)
}

export function starsFor(progress: Progress, levelId: number): number {
  return progress.stars[levelId] ?? 0
}

/** Primer nivel sin completar, que es el que late en el mapa. */
export function currentLevel(progress: Progress): number {
  for (let id = 1; id <= LEVEL_COUNT; id += 1) {
    if (starsFor(progress, id) === 0) return id
  }
  return LEVEL_COUNT
}

/**
 * Aplica el resultado de una partida. Un fallo gasta una vida; al llegar a cero
 * se recargan y se avisa, para no bloquear a nadie.
 */
export function applyRun(
  progress: Progress,
  levelId: number,
  outcome: RunOutcome,
): { progress: Progress; recovered: boolean } {
  const next: Progress = {
    version: 1,
    stars: { ...progress.stars },
    lives: progress.lives,
  }

  if ('stars' in outcome) {
    const best = Math.max(starsFor(progress, levelId), clampStars(outcome.stars))
    if (best > 0) next.stars[levelId] = best
    return { progress: next, recovered: false }
  }

  next.lives -= 1
  const recovered = next.lives < 1
  if (recovered) next.lives = MAX_LIVES

  return { progress: next, recovered }
}
