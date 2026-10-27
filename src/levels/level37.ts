import { createWorkshop, createWorkshopApi, judgeWorkshop, workshopSteps } from '../engine/workshop'
import { WorkshopScene } from './scenes/WorkshopScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_37: PlayableLevel = {
  id: 37,
  title: 'El taller',
  concept: '__init__, métodos y self',
  story:
    'El taller monta robots. La clase Robot ya tiene su __init__, que guarda el nombre y deja la lista de piezas vacía. Escribe montar(self, pieza), que añada la pieza a self.piezas con append(), y listo(self), que devuelva True cuando el robot lleve dos piezas o más. Monta a bruno = Robot("Bruno") con «rueda» y «antena», anuncia la ficha como «Bruno con 2 piezas», entrégala con revisar(bruno.nombre, bruno.piezas) y manda el parte con entregar(bruno.listo()).',
  hint:
    'Dentro de un método, self es el objeto que está trabajando: self.piezas.append(pieza) cambia su lista y self.nombre lee su nombre. Para el parte, len(self.piezas) >= 2 devuelve True o False. Consigue 3 estrellas con 15 líneas o menos.',
  starter: [
    'class Robot:',
    '    def __init__(self, nombre):',
    '        self.nombre = nombre',
    '        self.piezas = []',
    '',
    'bruno = Robot("Bruno")',
    '# Escribe montar(pieza) y listo(), monta las dos piezas, anuncia la ficha',
    '# y entrégala con revisar() y entregar().',
  ].join('\n'),
  solution: [
    'class Robot:',
    '    def __init__(self, nombre):',
    '        self.nombre = nombre',
    '        self.piezas = []',
    '',
    '    def montar(self, pieza):',
    '        self.piezas.append(pieza)',
    '',
    '    def listo(self):',
    '        return len(self.piezas) >= 2',
    '',
    'bruno = Robot("Bruno")',
    'bruno.montar("rueda")',
    'bruno.montar("antena")',
    'print(bruno.nombre + " con " + str(len(bruno.piezas)) + " piezas")',
    'revisar(bruno.nombre, bruno.piezas)',
    'entregar(bruno.listo())',
  ].join('\n'),
  par: 15,
  sceneTitle: 'El taller de robots',
  success: 'Robot montado, revisado y dado por listo.',
  Scene: WorkshopScene,
  start() {
    const workshop = createWorkshop()

    return {
      api: createWorkshopApi(workshop),
      finish(result) {
        return { ...judgeWorkshop(workshop, result.output), steps: workshopSteps(workshop) }
      },
    }
  },
}
