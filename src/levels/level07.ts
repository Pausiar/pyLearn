import { createShop, createShopApi, judgeShop, shopStep } from '../engine/shop'
import { ShopScene } from './scenes/ShopScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_07: PlayableLevel = {
  id: 7,
  title: 'La tienda',
  concept: 'input() simulado, int() y str()',
  story:
    'El pan cuesta 2 monedas y el cliente se lleva 3 barras, pero esas cifras las tienes que preguntar con input(): el cliente responde «2» y «3». Convierte las respuestas a números con int(), multiplica y anuncia el total con print(). La caja tiene que decir exactamente «Son 6 monedas».',
  hint:
    'input("¿Cuánto cuesta el pan? ") devuelve un texto: guárdalo y conviértelo con int(). Haz lo mismo con las barras, multiplica y monta el mensaje con str(total). Consigue 3 estrellas con 5 líneas o menos.',
  starter: [
    '# El cliente responde si preguntas con input().',
    '# 1. Pregunta el precio y conviértelo con int().',
    '# 2. Pregunta cuántas barras quiere y conviértelo también.',
    '# 3. Calcula el total y anúncialo con print().',
  ].join('\n'),
  solution: [
    'precio = int(input("¿Cuánto cuesta el pan? "))',
    'barras = int(input("¿Cuántas barras quieres? "))',
    'total = precio * barras',
    'print("Son " + str(total) + " monedas")',
  ].join('\n'),
  par: 5,
  sceneTitle: 'La tienda',
  success: 'La caja ha cuadradado.',
  Scene: ShopScene,
  start() {
    const shop = createShop()

    return {
      api: createShopApi(shop),
      finish(result) {
        return { ...judgeShop(shop, result.output), steps: [shopStep(shop, result.output)] }
      },
    }
  },
}
