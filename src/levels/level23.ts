import { createVending, createVendingApi, judgeVending, vendingSteps } from '../engine/vending'
import { VendingScene } from './scenes/VendingScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_23: PlayableLevel = {
  id: 23,
  title: 'La expendedora',
  concept: 'return',
  story:
    'La expendedora tiene tres ventas hoy: un zumo de 150 pagado con 200, unas galletas de 80 pagadas con 100 y un café de 120 pagado con 200. Escribe cambio(precio, pago) que devuelva la diferencia con return y entrégasela a la máquina con maquina(cambio): ella la llamará en cada venta y comprobará el cambio.',
  hint:
    'return devuelve el valor y termina la función; sin return, la función devuelve None y la máquina se queja. Consigue 3 estrellas con 4 líneas o menos.',
  starter: [
    '# La máquina llama a tu función con cada venta y espera el cambio exacto.',
    '# Escribe def cambio(precio, pago): con return pago - precio',
    '# y entrégasela con maquina(cambio).',
  ].join('\n'),
  solution: [
    'def cambio(precio, pago):',
    '    return pago - precio',
    '',
    'maquina(cambio)',
  ].join('\n'),
  par: 5,
  sceneTitle: 'La expendedora',
  success: 'Cambio exacto en las tres ventas.',
  Scene: VendingScene,
  start() {
    const vending = createVending()

    return {
      api: createVendingApi(vending),
      finish() {
        return { ...judgeVending(vending), steps: vendingSteps(vending) }
      },
    }
  },
}
