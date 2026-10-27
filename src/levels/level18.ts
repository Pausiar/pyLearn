import { createPizzeria, createPizzeriaApi, judgePizzeria, pizzeriaSteps } from '../engine/pizzeria'
import { PizzeriaScene } from './scenes/PizzeriaScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_18: PlayableLevel = {
  id: 18,
  title: 'La pizzería',
  concept: 'append, remove, insert, pop y sort',
  story:
    'La cola del día está en el editor: pedidos = ["barbacoa", "margarita", "cuatro quesos"]. Hoy pasan cinco cosas: añade «anchoas» al final con append(); un cliente cancela su margarita, así que quítala con remove("margarita"); una tarta entra con prisa y se pone la primera con insert(0, "tarta"); sirve la primera con servida = pedidos.pop(0) y deja el resto ordenado con sort(). Después anuncia dos líneas —«Servida: tarta» y la cola con print(pedidos), que tiene que salir exactamente [\'anchoas\', \'barbacoa\', \'cuatro quesos\']— y entrega la cola con cocina(pedidos).',
  hint:
    'Cada método cambia la lista: append(valor) añade al final, remove(valor) quita el que digas, insert(posicion, valor) mete en medio, pop(0) saca el primero y devuelve lo que saca, y sort() deja la lista en orden alfabético. Consigue 3 estrellas con 10 líneas o menos.',
  starter: [
    'pedidos = ["barbacoa", "margarita", "cuatro quesos"]',
    '# Añade "napolitana", quita "margarita", pon "tarta" la primera,',
    '# sirve la primera, ordena el resto y anuncia la cola.',
  ].join('\n'),
  solution: [
    'pedidos = ["barbacoa", "margarita", "cuatro quesos"]',
    'pedidos.append("anchoas")',
    'pedidos.remove("margarita")',
    'pedidos.insert(0, "tarta")',
    'servida = pedidos.pop(0)',
    'pedidos.sort()',
    'print("Servida: " + servida)',
    'print(pedidos)',
    'cocina(pedidos)',
  ].join('\n'),
  par: 10,
  sceneTitle: 'La cocina',
  success: 'Cola servida y ordenada.',
  Scene: PizzeriaScene,
  start() {
    const pizzeria = createPizzeria()

    return {
      api: createPizzeriaApi(pizzeria),
      finish(result) {
        return { ...judgePizzeria(pizzeria, result.output), steps: pizzeriaSteps(pizzeria) }
      },
    }
  },
}
