import { createPet, createPetApi, judgePet, petSteps } from '../engine/pet'
import { PetScene } from './scenes/PetScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_36: PlayableLevel = {
  id: 36,
  title: 'La mascota',
  concept: 'class, instancias y atributos',
  story:
    'El refugio de mascotas funciona con objetos. La clase Mascota ya está empezada: su __init__ guarda el nombre y deja la energía en 3. Escribe el método jugar(self), que quite una energía (self.energia = self.energia - 1) y devuelva las que quedan. Después crea rex = Mascota("Rex") y anuncia cuatro líneas: «Nombre: Rex», «Energia: 3», «Jugar: 2» y «Ahora: 2»; la última sirve para comprobar que jugar() sí cambia el atributo del objeto. Termina apuntando la mascota en el refugio con apuntar(rex.nombre, rex.energia).',
  hint:
    'Un objeto es una instancia de la clase: Mascota("Rex") ejecuta __init__ y guarda el nombre y la energía dentro de rex. Los atributos se leen con rex.nombre y rex.energia, y se cambian igual: rex.energia = 2, o self.energia dentro de un método. Junta textos y números con str(). Consigue 3 estrellas con 14 líneas o menos.',
  starter: [
    'class Mascota:',
    '    def __init__(self, nombre):',
    '        self.nombre = nombre',
    '        self.energia = 3',
    '',
    'rex = Mascota("Rex")',
    '# Escribe el método jugar(self), anuncia el nombre, la energía,',
    '# un juego y la energía que queda, y apunta la mascota en el refugio.',
  ].join('\n'),
  solution: [
    'class Mascota:',
    '    def __init__(self, nombre):',
    '        self.nombre = nombre',
    '        self.energia = 3',
    '',
    '    def jugar(self):',
    '        self.energia = self.energia - 1',
    '        return self.energia',
    '',
    'rex = Mascota("Rex")',
    'print("Nombre: " + rex.nombre)',
    'print("Energia: " + str(rex.energia))',
    'print("Jugar: " + str(rex.jugar()))',
    'print("Ahora: " + str(rex.energia))',
    'apuntar(rex.nombre, rex.energia)',
  ].join('\n'),
  par: 14,
  sceneTitle: 'El refugio de mascotas',
  success: 'Mascota criada, jugada y apuntada en el refugio.',
  Scene: PetScene,
  start() {
    const pet = createPet()

    return {
      api: createPetApi(pet),
      finish(result) {
        return { ...judgePet(pet, result.output), steps: petSteps(pet) }
      },
    }
  },
}
