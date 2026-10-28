import { createGrid, createGridApi, gridSteps, judgeGrid } from '../engine/grid'
import { GridScene } from './scenes/GridScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_15: PlayableLevel = {
  id: 15,
  title: 'El campo entero',
  concept: 'Bucles anidados',
  story:
    'El campo del jefe son 3 filas de 4 cultivos. Riega las 12 casillas con dos bucles anidados: uno para las filas y otro, dentro, para las 4 casillas de cada fila. En cada casilla, regar() y avanzar(): avanzar() baja solo a la fila siguiente al terminar una. Y al acabar cada fila, avisa con print(): «Fila 1 regada», «Fila 2 regada» y «Fila 3 regada».',
  hint:
    'for fila in range(1, 4): y dentro, con sangría, for casilla in range(4): con regar() y avanzar(). El print() de la fila va dentro del bucle de las filas, pero fuera del de las casillas. Consigue 3 estrellas con 7 líneas o menos.',
  starter: [
    '# Tres filas con cuatro cultivos cada una.',
    '# Dos bucles, uno dentro de otro, y un aviso por fila.',
  ].join('\n'),
  solution: [
    'for fila in range(1, 4):',
    '    for casilla in range(4):',
    '        regar()',
    '        avanzar()',
    '    print("Fila " + str(fila) + " regada")',
  ].join('\n'),
  par: 7,
  sceneTitle: 'El campo del jefe',
  success: 'El campo entero regado, fila a fila.',
  Scene: GridScene,
  start() {
    const grid = createGrid()

    return {
      api: createGridApi(grid),
      finish(result) {
        return { ...judgeGrid(grid, result.output), steps: gridSteps(grid) }
      },
    }
  },
}
