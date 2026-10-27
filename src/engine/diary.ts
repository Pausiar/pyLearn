import type { RunResult } from '../interp/run'
import type { SceneStep } from './scene'

/** El archivo del diario, en la memoria del nivel. */
export const DIARY_FILE = 'diario.txt'

/** Las tres líneas que tiene que llevar el diario, en orden. */
export const DIARY_ENTRIES: readonly string[] = [
  'Día 1: despegue',
  'Día 2: órbita',
  'Día 3: vuelta',
]

/** Lo que tiene que salir por la consola: las tres líneas y el recuento. */
export const DIARY_OUTPUT: readonly string[] = [
  ...DIARY_ENTRIES,
  `Líneas: ${DIARY_ENTRIES.length}`,
]

/** El diario tal y como lo ha dejado el alumno, si lo ha escrito. */
export function diaryContent(result: RunResult): string | undefined {
  return result.files?.[DIARY_FILE]
}

export function judgeDiary(result: RunResult): { complete: boolean; missing: string } {
  const announced = DIARY_OUTPUT.findIndex((expected, index) => result.output[index] !== expected)
  if (announced !== -1) {
    return {
      complete: false,
      missing: `La línea ${announced + 1} no es la esperada: con print() tiene que salir «${DIARY_OUTPUT[announced]}».`,
    }
  }

  if (result.output.length < DIARY_OUTPUT.length) {
    return {
      complete: false,
      missing: `Faltan líneas del diario: la siguiente tiene que ser «${DIARY_OUTPUT[result.output.length]}».`,
    }
  }

  const content = diaryContent(result)
  if (content === undefined) {
    return {
      complete: false,
      missing:
        'No hay ningún archivo «diario.txt»: escríbelo con with open("diario.txt", "w") as diario: y sus write().',
    }
  }

  const written = content.split('\n').filter((line) => line !== '')
  if (written.join('|') !== DIARY_ENTRIES.join('|')) {
    const shown = written.length === 0 ? 'vacío' : `«${written.join('», «')}»`
    return {
      complete: false,
      missing: `El diario tiene que llevar ${DIARY_ENTRIES.length} líneas —«${DIARY_ENTRIES.join('», «')}»— y en el archivo pone ${shown}.`,
    }
  }

  return { complete: true, missing: '' }
}

/** Traza visual: el diario escribiéndose, línea a línea, y el recuento final. */
export function diarySteps(result: RunResult): SceneStep[] {
  const content = diaryContent(result)
  const lines = content === undefined ? [] : content.split('\n').filter((line) => line !== '')
  const steps: SceneStep[] = [{ kind: 'diary', lines: [], counted: false }]

  lines.forEach((_, index) => {
    steps.push({ kind: 'diary', lines: lines.slice(0, index + 1), counted: false })
  })

  steps.push({
    kind: 'diary',
    lines: lines.length === 0 ? DIARY_ENTRIES.map(() => '') : lines,
    counted: lines.length === DIARY_ENTRIES.length,
  })

  return steps
}
