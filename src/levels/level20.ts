import {
  createAdventurer,
  createAdventurerApi,
  adventurerSteps,
  judgeAdventurer,
} from '../engine/adventurer'
import { AdventureScene } from './scenes/AdventureScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_20: PlayableLevel = {
  id: 20,
  title: 'Mochila de aventurero',
  concept: 'Listas, bucles y condicionales',
  story:
    'El aventurero tiene la mochila llena, pero solo va a llevar lo ligero. En el editor están los objetos y sus pesos, en el mismo orden: mochila = ["espada", "antorcha", "cuerda", "escudo", "manzana", "brújula"] y pesos = [8, 2, 3, 6, 1, 1]. Construye una lista nueva, ligera = [], y recórrela con for i in range(len(mochila)): si pesos[i] es 3 o menos, copia mochila[i] con append(). Ordénala con sort() y anuncia cuántos objetos van con print(): tiene que decir «Ligera: 4 objetos». Después entrega la mochila con salir(ligera).',
  hint:
    'for i in range(len(mochila)): recorre las posiciones de la lista. Dentro, if pesos[i] <= 3: y, con otra sangría, ligera.append(mochila[i]). Al salir del bucle, ligera.sort() y el print() con len(ligera). Consigue 3 estrellas con 9 líneas o menos.',
  starter: [
    'mochila = ["espada", "antorcha", "cuerda", "escudo", "manzana", "brújula"]',
    'pesos = [8, 2, 3, 6, 1, 1]',
    'ligera = []',
    '# Copia a ligera los objetos que pesen 3 o menos, ordénala y anúncialos.',
  ].join('\n'),
  solution: [
    'mochila = ["espada", "antorcha", "cuerda", "escudo", "manzana", "brújula"]',
    'pesos = [8, 2, 3, 6, 1, 1]',
    'ligera = []',
    'for i in range(len(mochila)):',
    '    if pesos[i] <= 3:',
    '        ligera.append(mochila[i])',
    'ligera.sort()',
    'print("Ligera: " + str(len(ligera)) + " objetos")',
    'salir(ligera)',
  ].join('\n'),
  par: 9,
  sceneTitle: 'La mochila del aventurero',
  success: 'Mochila ligera preparada y ordenada.',
  Scene: AdventureScene,
  start() {
    const adventurer = createAdventurer()

    return {
      api: createAdventurerApi(adventurer),
      finish(result) {
        return { ...judgeAdventurer(adventurer, result.output), steps: adventurerSteps(adventurer) }
      },
    }
  },
}
