import { judgePlan, planSteps } from '../engine/plan'
import { PlanScene } from './scenes/PlanScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_05: PlayableLevel = {
  id: 5,
  title: 'Plan de la jornada',
  concept: 'Repaso del mundo 1',
  story:
    'Último día en la granja. Antes de salir, escribe el plan con print(): tres líneas que digan «Hora 6: Riego», «Hora 7: Cosecha» y «Hora 9: Venta». Guarda cada hora en una variable y únela con str(). El sol sale con cada línea que escribes.',
  hint:
    'Guarda 6, 7 y 9 en variables. Cada línea es un print("Hora " + str(h) + ": ..."), con el texto exacto. Consigue 3 estrellas con 6 líneas o menos.',
  starter: ['# El plan del día está en blanco.', '# Escribe las tres líneas con print().'].join('\n'),
  solution: [
    'h1 = 6',
    'h2 = 7',
    'h3 = 9',
    'print("Hora " + str(h1) + ": Riego")',
    'print("Hora " + str(h2) + ": Cosecha")',
    'print("Hora " + str(h3) + ": Venta")',
  ].join('\n'),
  par: 6,
  sceneTitle: 'El plan',
  success: 'Plan de la jornada completo.',
  Scene: PlanScene,
  start() {
    return {
      api: {},
      finish(result) {
        const verdict = judgePlan(result.output)
        return { ...verdict, steps: planSteps(result.output, verdict.complete) }
      },
    }
  },
}
