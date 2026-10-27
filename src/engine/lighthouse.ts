/** Los tres mensajes que el faro tiene que enviar, en orden. */
export const LIGHTHOUSE_MESSAGES: readonly string[] = ['SOS', 'PYLEARN', 'AYUDA']

/** Un paso por mensaje enviado, acumulando lo que ya se ha dicho. */
export function lighthouseSteps(output: readonly string[]): { kind: 'lighthouse'; lines: string[] }[] {
  return [
    { kind: 'lighthouse', lines: [] },
    ...output.map((_, index) => ({
      kind: 'lighthouse' as const,
      lines: output.slice(0, index + 1),
    })),
  ]
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

  const sent = output.map((line) => `«${line}»`).join(', ')
  return {
    complete: false,
    missing: `El faro ha enviado ${sent}. Tiene que enviar «SOS», «PYLEARN» y «AYUDA», en ese orden.`,
  }
}
