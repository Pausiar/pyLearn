import { describe, expect, it } from 'vitest'
import {
  LEGACY_KEY,
  MAX_LIVES,
  PROGRESS_KEY,
  applyRun,
  currentLevel,
  emptyProgress,
  loadProgress,
  parseProgress,
  saveProgress,
  totalStars,
} from './progress'
import type { StorageLike } from './storage'

function memoryStorage(seed: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...seed }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

describe('progreso', () => {
  it('empieza sin estrellas y con tres vidas', () => {
    expect(emptyProgress()).toEqual({ version: 1, stars: {}, lives: 3 })
  })

  it('migra el formato de la demo ({ st, lives })', () => {
    const progress = parseProgress(JSON.stringify({ st: { 1: 3, 2: 1 }, lives: 2 }))

    expect(progress).toEqual({ version: 1, stars: { 1: 3, 2: 1 }, lives: 2 })
  })

  it('lee la clave nueva antes que la de la demo', () => {
    const storage = memoryStorage({
      [PROGRESS_KEY]: JSON.stringify({ version: 1, stars: { 4: 3 }, lives: 1 }),
      [LEGACY_KEY]: JSON.stringify({ st: { 1: 1 }, lives: 3 }),
    })

    expect(loadProgress(storage).stars).toEqual({ 4: 3 })
  })

  it('migra la clave de la demo si no hay clave nueva', () => {
    const storage = memoryStorage({ [LEGACY_KEY]: JSON.stringify({ st: { 1: 2 }, lives: 3 }) })

    expect(loadProgress(storage)).toEqual({ version: 1, stars: { 1: 2 }, lives: 3 })
  })

  it('devuelve el progreso vacío ante datos inválidos', () => {
    expect(parseProgress('{no es json')).toBeNull()
    expect(parseProgress('42')).toBeNull()
    expect(parseProgress(JSON.stringify({ hola: true }))).toBeNull()
    expect(loadProgress(memoryStorage({ [PROGRESS_KEY]: '{"stars":"muchas"}' }))).toEqual(
      emptyProgress(),
    )
  })

  it('acota estrellas y vidas y descarta niveles fuera de rango', () => {
    const progress = parseProgress(
      JSON.stringify({ stars: { 1: 9, 2: -4, 3: 2.7, 99: 3, 0: 3 }, lives: 12 }),
    )

    expect(progress).toEqual({ version: 1, stars: { 1: 3, 3: 2 }, lives: MAX_LIVES })
  })

  it('sobrevive a un almacenamiento que lanza errores', () => {
    const broken: StorageLike = {
      getItem() {
        throw new Error('bloqueado')
      },
      setItem() {
        throw new Error('bloqueado')
      },
    }

    expect(loadProgress(broken)).toEqual(emptyProgress())
    expect(saveProgress(broken, emptyProgress())).toBe(false)
    expect(loadProgress(null)).toEqual(emptyProgress())
  })

  it('guarda y recupera el mismo progreso', () => {
    const storage = memoryStorage()
    const progress = { version: 1 as const, stars: { 1: 3 }, lives: 2 }

    expect(saveProgress(storage, progress)).toBe(true)
    expect(loadProgress(storage)).toEqual(progress)
  })

  it('nunca baja las estrellas ya ganadas', () => {
    const progress = { version: 1 as const, stars: { 1: 3 }, lives: 3 }

    expect(applyRun(progress, 1, { stars: 1 }).progress.stars).toEqual({ 1: 3 })
  })

  it('resta una vida al fallar y recarga al llegar a cero', () => {
    const base = { version: 1 as const, stars: {}, lives: 1 }
    const result = applyRun(base, 1, { failed: true })

    expect(result.recovered).toBe(true)
    expect(result.progress.lives).toBe(MAX_LIVES)
  })

  it('cuenta el total de estrellas y el nivel actual', () => {
    const progress = { version: 1 as const, stars: { 1: 3, 2: 2 }, lives: 3 }

    expect(totalStars(progress)).toBe(5)
    expect(currentLevel(progress)).toBe(3)
    expect(currentLevel({ version: 1, stars: {}, lives: 3 })).toBe(1)
  })
})
