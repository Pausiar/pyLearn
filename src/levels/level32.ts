import { createDice, createDiceApi, diceSteps, judgeDice } from '../engine/dice'
import { DiceScene } from './scenes/DiceScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_32: PlayableLevel = {
  id: 32,
  title: 'Dados',
  concept: 'random y math',
  story:
    'La mesa de dados pide tres tiradas con semilla para que la partida se pueda repetir. Empieza con random.seed(7) y tira tres veces con random.randint(1, 6), guardando cada tirada con append() en una lista que empiece vacía. Anuncia la lista con print(tiradas) y después su media entera, calculada con math.floor(sum(tiradas) / 3) y anunciada como «Media: » seguido del número. Con la semilla 7 las tres tiradas salen siempre igual, así que si el anuncio no cuadra es que has tirado con otra semilla o en otro orden. Entrega la lista con mesa(tiradas).',
  hint:
    'random.seed(7) deja el azar preparado: a partir de ahí randint(1, 6) da siempre los mismos números. sum(tiradas) suma la lista y math.floor(x) redondea hacia abajo; entre los dos sale la media entera. Consigue 3 estrellas con 9 líneas o menos.',
  starter: [
    '# random.seed(7) fija la semilla y random.randint(1, 6) tira un dado.',
    'tiradas = []',
    '# Tira tres veces, anuncia la lista y su media entera, y entrega las tiradas.',
  ].join('\n'),
  solution: [
    'random.seed(7)',
    'tiradas = []',
    'for i in range(3):',
    '    tiradas.append(random.randint(1, 6))',
    'print(tiradas)',
    'print("Media: " + str(math.floor(sum(tiradas) / 3)))',
    'mesa(tiradas)',
  ].join('\n'),
  par: 9,
  sceneTitle: 'La mesa de dados',
  success: 'Tiradas de la semilla y media entera, apuntadas.',
  Scene: DiceScene,
  start() {
    const dice = createDice()

    return {
      api: createDiceApi(dice),
      finish(result) {
        return { ...judgeDice(dice, result.output), steps: diceSteps(dice) }
      },
    }
  },
}
