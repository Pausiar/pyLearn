/** Los tres mensajes que el faro tiene que enviar, en orden. */
export const LIGHTHOUSE_MESSAGES: readonly string[] = ['SOS', 'PYLEARN', 'AYUDA']

export interface LighthouseStep {
  kind: 'lighthouse'
  lines: string[]
  rescued: boolean
}

/**
 * Un paso por mensaje enviado, acumulando lo que ya se ha dicho. Si el faro
 * ha acertado, un último paso lanza el barco de rescate.
 */
export function lighthouseSteps(output: readonly string[], rescued = false): LighthouseStep[] {
  const steps: LighthouseStep[] = [{ kind: 'lighthouse', lines: [], rescued: false }]

  output.forEach((_, index) => {
    steps.push({ kind: 'lighthouse', lines: output.slice(0, index + 1), rescued: false })
  })

  if (rescued) {
    steps.push({ kind: 'lighthouse', lines: [...output], rescued: true })
  }

  return steps
}

export function judgeLighthouse(output: readonly string[]): { complete: boolean; missing: string } {
  const expected = [...LIGHTHOUSE_MESSAGES]

  if (output.length === 0) {
    return {
      complete: false,
      missing: 'El faro sigue apagado: usa print() para enviar el primer mensaje.',
    }
  }

  const correct = output.length === expected.length && output.every((line, index) => line === expected[index])
  if (correct) return { complete: true, missing: '' }

  // Mismo mensaje pero con otras mayúsculas: el caso más habitual, y el que enseña cadenas.
  const sameWords =
    output.length === expected.length && output.every((line, index) => line.toUpperCase() === expected[index])
  if (sameWords) {
    const index = output.findIndex((line, i) => line !== expected[i])
    return {
      complete: false,
      missing: `Casi: «${output[index]}» no es «${expected[index]}». Python copia las cadenas tal cual, con sus mayúsculas.`,
    }
  }

  const sent = output.map((line) => `«${line}»`).join(', ')
  return {
    complete: false,
    missing: `El faro ha enviado ${sent}. Tiene que enviar «SOS», «PYLEARN» y «AYUDA», en ese orden.`,
  }
}
