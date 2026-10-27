import { createOven, createOvenApi, judgeOven, ovenSteps } from '../engine/oven'
import { OvenScene } from './scenes/OvenScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_22: PlayableLevel = {
  id: 22,
  title: 'Pizzas a medida',
  concept: 'Parámetros y valores por defecto',
  story:
    'La pizzería abre con el ticket del día: 3 margaritas, 2 barbacoas y 1 anchoas. El servicio canta la tanda y llama a tu función con cada pedido: cuando quiere una sola pizza solo te dice el sabor. Escribe preparar(sabor, cantidad=1) que llame a hornear(sabor, cantidad), y entrégasela con tanda(preparar).',
  hint:
    'El valor por defecto se escribe en la definición del parámetro: def preparar(sabor, cantidad=1):. Si llaman a tu función con un solo dato, cantidad vale 1. Consigue 3 estrellas con 4 líneas o menos.',
  starter: [
    '# El servicio canta la tanda: 3 margaritas, 2 barbacoas y 1 anchoas.',
    '# Escribe def preparar(sabor, cantidad=1): que llame a hornear(sabor, cantidad)',
    '# y entrégasela con tanda(preparar).',
  ].join('\n'),
  solution: [
    'def preparar(sabor, cantidad=1):',
    '    hornear(sabor, cantidad)',
    '',
    'tanda(preparar)',
  ].join('\n'),
  par: 5,
  sceneTitle: 'El horno de la pizzería',
  success: 'Tanda completa: el ticket ha salido entero.',
  Scene: OvenScene,
  start() {
    const oven = createOven()

    return {
      api: createOvenApi(oven),
      finish() {
        return { ...judgeOven(oven), steps: ovenSteps(oven) }
      },
    }
  },
}
