import {
  createRestaurant,
  createRestaurantApi,
  judgeRestaurant,
  restaurantSteps,
} from '../engine/restaurant'
import { RestaurantScene } from './scenes/RestaurantScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_25: PlayableLevel = {
  id: 25,
  title: 'Cocina modular',
  concept: 'Funciones que llaman a funciones',
  story:
    'El restaurante abre con tres platos: sopa, tarta y otra sopa. El maître entrega la comanda con carta(sopa, tarta, cocinar): llamará a tus recetas sopa(ingrediente) y tarta(ingrediente) y después a cocinar("sopa"), que tiene que llamar a una de tus recetas. Cada plato se pica, pasa por el fuego — hervir() o hornear() — y se sirve con servir("sopa") o servir("tarta").',
  hint:
    'Una receta puede llamar a otra: dentro de cocinar() decide el plato con if y llama a sopa() o tarta(). Consigue 3 estrellas con 15 líneas o menos.',
  starter: [
    '# El maître llamará a tus recetas: sopa(ingrediente), tarta(ingrediente)',
    '# y cocinar(plato), que tiene que llamar a una de las otras dos.',
    '# Cada receta pica su ingrediente, lo pasa por el fuego y sirve el plato.',
  ].join('\n'),
  solution: [
    'def sopa(ingrediente):',
    '    picar(ingrediente)',
    '    hervir(ingrediente)',
    '    servir("sopa")',
    '',
    'def tarta(ingrediente):',
    '    picar(ingrediente)',
    '    hornear(ingrediente)',
    '    servir("tarta")',
    '',
    'def cocinar(plato):',
    '    if plato == "sopa":',
    '        sopa("cebolla")',
    '    else:',
    '        tarta("manzana")',
    '',
    'carta(sopa, tarta, cocinar)',
  ].join('\n'),
  par: 15,
  sceneTitle: 'La cocina',
  success: 'Servicio completo: las recetas se llaman entre ellas.',
  Scene: RestaurantScene,
  start() {
    const restaurant = createRestaurant()

    return {
      api: createRestaurantApi(restaurant),
      finish() {
        return { ...judgeRestaurant(restaurant), steps: restaurantSteps(restaurant) }
      },
    }
  },
}
