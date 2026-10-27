import { createMine, createMineApi, judgeMine, mineSteps } from '../engine/mine'
import { MineScene } from './scenes/MineScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_12: PlayableLevel = {
  id: 12,
  title: 'El minero',
  concept: 'while y contadores',
  story:
    'La veta tiene 6 piedras y el robot no sabe cuántas aguantarán sus brazos: tiene que picar mientras queden. Consulta la veta con hay_piedra(), pica con picar() dentro de un while, lleva la cuenta de las picadas en una variable y anúnciala al final con print(): el minero tiene que decir exactamente «He picado 6 piedras».',
  hint:
    'Empieza con picadas = 0. Después while hay_piedra(): y dentro, con sangría, picar() y picadas = picadas + 1. Al salir del bucle, print("He picado " + str(picadas) + " piedras"). Consigue 3 estrellas con 6 líneas o menos.',
  starter: [
    '# La veta tiene 6 piedras.',
    'picadas = 0',
    '# Pica mientras queden piedras y anuncia la cuenta al terminar.',
  ].join('\n'),
  solution: [
    'picadas = 0',
    'while hay_piedra():',
    '    picar()',
    '    picadas = picadas + 1',
    'print("He picado " + str(picadas) + " piedras")',
  ].join('\n'),
  par: 6,
  sceneTitle: 'La mina',
  success: 'Veta agotada y cuenta anunciada.',
  Scene: MineScene,
  start() {
    const mine = createMine()

    return {
      api: createMineApi(mine),
      finish(result) {
        return { ...judgeMine(mine, result.output), steps: mineSteps(mine) }
      },
    }
  },
}
