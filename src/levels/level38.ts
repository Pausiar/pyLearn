import { beastSteps, createBeast, createBeastApi, judgeBeast } from '../engine/beasts'
import { BeastScene } from './scenes/BeastScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_38: PlayableLevel = {
  id: 38,
  title: 'Herencia',
  concept: 'Herencia, super() y polimorfismo',
  story:
    'El bestiario crece con herencia. La clase Monstruo ya está: guarda nombre y vida, y golpe() quita una vida y devuelve las que quedan. Añade a Monstruo el método presentar(self), que devuelva el nombre y la vida como «Smaug con 5». Después crea la clase Dragon(Monstruo), cuyo __init__(self, nombre) llame a la clase madre con super().__init__(nombre, 5), y dale un método rugir(self) que devuelva «¡GRRR!». Crea smaug = Dragon("Smaug"), anuncia las tres líneas —«Smaug con 5», «Rugido: ¡GRRR!» y «Golpe: 4»— y apunta el combate con combate(smaug.nombre, smaug.vida).',
  hint:
    'class Dragon(Monstruo): hereda todos los métodos de la madre: smaug.presentar() y smaug.golpe() funcionan aunque estén escritos en Monstruo. super().__init__(nombre, 5) llama al __init__ de la clase madre para no repetir código. Consigue 3 estrellas con 20 líneas o menos.',
  starter: [
    'class Monstruo:',
    '    def __init__(self, nombre, vida):',
    '        self.nombre = nombre',
    '        self.vida = vida',
    '',
    '    def golpe(self):',
    '        self.vida = self.vida - 1',
    '        return self.vida',
    '',
    '# Añade presentar(), crea la clase Dragon con su super() y su rugir(),',
    '# anuncia las tres líneas y apunta el combate en el bestiario.',
  ].join('\n'),
  solution: [
    'class Monstruo:',
    '    def __init__(self, nombre, vida):',
    '        self.nombre = nombre',
    '        self.vida = vida',
    '',
    '    def golpe(self):',
    '        self.vida = self.vida - 1',
    '        return self.vida',
    '',
    '    def presentar(self):',
    '        return self.nombre + " con " + str(self.vida)',
    '',
    'class Dragon(Monstruo):',
    '    def __init__(self, nombre):',
    '        super().__init__(nombre, 5)',
    '',
    '    def rugir(self):',
    '        return "¡GRRR!"',
    '',
    'smaug = Dragon("Smaug")',
    'print(smaug.presentar())',
    'print("Rugido: " + smaug.rugir())',
    'print("Golpe: " + str(smaug.golpe()))',
    'combate(smaug.nombre, smaug.vida)',
  ].join('\n'),
  par: 20,
  sceneTitle: 'El bestiario',
  success: 'Dragón heredado del monstruo, con su rugido y su golpe.',
  Scene: BeastScene,
  start() {
    const beast = createBeast()

    return {
      api: createBeastApi(beast),
      finish(result) {
        return { ...judgeBeast(beast, result.output), steps: beastSteps(beast) }
      },
    }
  },
}
