import { createRocket, createRocketApi, judgeRocket, rocketStep } from '../engine/rocket'
import { RocketScene } from './scenes/RocketScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_06: PlayableLevel = {
  id: 6,
  title: 'Combustible',
  concept: 'Números y operadores',
  story:
    'El cohete lleva 7 tanques de 12 toneladas cada uno y gasta 15 en el despegue. Calcula lo que le queda con variables y operadores, y avisa a la torre con torre(toneladas) para que arranque.',
  hint:
    'Multiplica los tanques por lo que lleva cada uno y réstale lo gastado. Después llama a torre() con esa variable. Consigue 3 estrellas con 6 líneas o menos.',
  starter: [
    '# 7 tanques, 12 toneladas cada uno, 15 gastadas.',
    'tanques = 7',
    'por_tanque = 12',
    'gastado = 15',
    '# Calcula el combustible y avisa a la torre.',
  ].join('\n'),
  solution: [
    'tanques = 7',
    'por_tanque = 12',
    'gastado = 15',
    'combustible = tanques * por_tanque - gastado',
    'torre(combustible)',
  ].join('\n'),
  par: 6,
  sceneTitle: 'El cohete',
  success: 'La torre ha confirmado el combustible.',
  Scene: RocketScene,
  start() {
    const rocket = createRocket()

    return {
      api: createRocketApi(rocket),
      finish() {
        return { ...judgeRocket(rocket), steps: [rocketStep(rocket)] }
      },
    }
  },
}
