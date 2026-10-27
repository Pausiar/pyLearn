import { createLab, createLabApi, judgeLab } from '../engine/lab'
import { LabScene } from './scenes/LabScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_24: PlayableLevel = {
  id: 24,
  title: 'Laboratorios',
  concept: 'Ámbito local y global',
  story:
    'En el laboratorio hay una base y dos sitios: la sala, dentro de la función, y la calle, fuera. El termostato da la base del día: guárdala en una variable global con base = termostato(). Escribe calentar(grados) que use una variable propia, temperatura = base + grados, y la devuelva con return. Después apunta cuatro lecturas con medir(): la sala con calentar(5), fuera con base, la sala con calentar(8) y fuera con base otra vez.',
  hint:
    'Dentro de la función, temperatura es local: vive solo mientras calentar() corre. No asignes a base dentro de la función: al asignar, para Python base sería local desde el principio y fallaría al leerla. Consigue 3 estrellas con 9 líneas o menos.',
  starter: [
    '# El termostato da la base del día: base = termostato().',
    '# Escribe def calentar(grados): con su temperatura local (base + grados)',
    '# y apunta las cuatro lecturas con medir().',
  ].join('\n'),
  solution: [
    'base = termostato()',
    '',
    'def calentar(grados):',
    '    temperatura = base + grados',
    '    return temperatura',
    '',
    'medir("sala", calentar(5))',
    'medir("fuera", base)',
    'medir("sala", calentar(8))',
    'medir("fuera", base)',
  ].join('\n'),
  par: 9,
  sceneTitle: 'El cuaderno del laboratorio',
  success: 'Cuaderno con las cuatro lecturas, dentro y fuera.',
  Scene: LabScene,
  start() {
    const lab = createLab()

    return {
      api: createLabApi(lab),
      finish(_result, code) {
        return judgeLab(lab, code)
      },
    }
  },
}
