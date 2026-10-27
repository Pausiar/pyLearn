export const LEVEL_01 = {
  id: 1,
  title: 'Primer vuelo',
  story:
    'El dron está en el hangar y cuatro cultivos se están secando. Escribe las instrucciones para que avance hasta cada uno y lo riegue. Python lee tus líneas en orden, de arriba abajo.',
  hint:
    'Cada avanzar() mueve el dron una casilla a la derecha. regar() riega el cultivo que tiene debajo. Avanza, riega, y repite con cada planta. Consigue 3 estrellas con 8 líneas o menos.',
  starter: [
    '# El dron empieza en el hangar (casilla 0).',
    '# Los cultivos están en las casillas 1, 2, 3 y 4.',
    'avanzar()',
    'regar()',
    '',
  ].join('\n'),
  solution: [
    'avanzar()',
    'regar()',
    'avanzar()',
    'regar()',
    'avanzar()',
    'regar()',
    'avanzar()',
    'regar()',
  ].join('\n'),
} as const

/** Tres estrellas con 8 líneas o menos; dos hasta 10; una por terminarlo. */
export function starsForLines(lines: number): number {
  if (lines <= 8) return 3
  if (lines <= 10) return 2
  return 1
}
