import { createHunt, createHuntApi, huntSteps, judgeHunt } from '../engine/hunt'
import { HuntScene } from './scenes/HuntScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_29: PlayableLevel = {
  id: 29,
  title: 'Cazamonstruos',
  concept: 'Comprensiones de listas',
  story:
    'En el bosque hay cinco monstruos con su nivel de peligro, en el mismo orden: monstruos = ["draco", "ogro", "hada", "trol", "goblin"] y niveles = [3, 8, 2, 9, 7]. Al cazador solo le interesan los que pasan del nivel 5. Construye la lista de un tirón con una comprensión —peligrosos = [monstruos[i] for i in range(len(monstruos)) if niveles[i] > 5]— y anuncia cuántos son: «Peligrosos: 3». Después imprime la lista ordenada con print(sorted(peligrosos)), que tiene que salir exactamente [\'goblin\', \'ogro\', \'trol\'], y entrega la lista con capturar(peligrosos).',
  hint:
    'La comprensión se lee de dentro hacia fuera: para cada i del range, si niveles[i] > 5, guarda monstruos[i]. sorted(peligrosos) devuelve una lista nueva en orden alfabético sin tocar la original. Consigue 3 estrellas con 7 líneas o menos.',
  starter: [
    'monstruos = ["draco", "ogro", "hada", "trol", "goblin"]',
    'niveles = [3, 8, 2, 9, 7]',
    '# Filtra con una comprensión los que pasan del nivel 5, anuncia cuántos',
    '# son y cómo se llaman en orden alfabético. Después entrégalos.',
  ].join('\n'),
  solution: [
    'monstruos = ["draco", "ogro", "hada", "trol", "goblin"]',
    'niveles = [3, 8, 2, 9, 7]',
    'peligrosos = [monstruos[i] for i in range(len(monstruos)) if niveles[i] > 5]',
    'print("Peligrosos: " + str(len(peligrosos)))',
    'print(sorted(peligrosos))',
    'capturar(peligrosos)',
  ].join('\n'),
  par: 7,
  sceneTitle: 'El bosque de los monstruos',
  success: 'Solo los peligrosos han ido a la jaula.',
  Scene: HuntScene,
  start() {
    const hunt = createHunt()

    return {
      api: createHuntApi(hunt),
      finish(result) {
        return { ...judgeHunt(hunt, result.output), steps: huntSteps(hunt) }
      },
    }
  },
}
