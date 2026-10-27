import { createForge, createForgeApi, forgeSteps, judgeForge } from '../engine/forge'
import { ForgeScene } from './scenes/ForgeScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_40: PlayableLevel = {
  id: 40,
  title: 'Tu juego',
  concept: 'Proyecto libre',
  story:
    'Última prueba: tu minijuego, con el motor jugando por ti. Escribe crear(nombre), que devuelva el diccionario del héroe con «nombre» en el nombre que recibe, «vida» en 3 y «pasos» en 0; y mover(estado, direccion), que sume uno a estado["pasos"], quite una vida a estado["vida"] cuando la dirección sea "norte" y devuelva el estado. El motor llamará a crear("Ana") y después a mover() tres veces, por el recorrido norte, sur y norte: al final el héroe tiene que acabar con 1 de vida y 3 pasos. Pásale las dos funciones con jugar(crear, mover).',
  hint:
    'estado["pasos"] = estado["pasos"] + 1 cambia el diccionario que te llega, y return estado devuelve el héroe actualizado. Los textos se comparan con ==: if direccion == "norte":. Consigue 3 estrellas con 9 líneas o menos.',
  starter: [
    '# Tu minijuego: escribe crear(nombre) y mover(estado, direccion)',
    '# y pásaselas al motor con jugar(crear, mover).',
  ].join('\n'),
  solution: [
    'def crear(nombre):',
    '    return {"nombre": nombre, "vida": 3, "pasos": 0}',
    '',
    'def mover(estado, direccion):',
    '    estado["pasos"] = estado["pasos"] + 1',
    '    if direccion == "norte":',
    '        estado["vida"] = estado["vida"] - 1',
    '    return estado',
    '',
    'jugar(crear, mover)',
  ].join('\n'),
  par: 9,
  sceneTitle: 'Tu minijuego',
  success: 'El motor ha jugado tu minijuego de principio a fin.',
  Scene: ForgeScene,
  start() {
    const forge = createForge()

    return {
      api: createForgeApi(forge),
      finish() {
        return { ...judgeForge(forge), steps: forgeSteps(forge) }
      },
    }
  },
}
