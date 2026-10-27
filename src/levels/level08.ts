import { createLocks, createLocksApi, judgeLocks, locksStep } from '../engine/locks'
import { LocksScene } from './scenes/LocksScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_08: PlayableLevel = {
  id: 8,
  title: 'La cerradura',
  concept: 'Booleanos, comparaciones y lógica',
  story:
    'El cohete solo despega con piloto, y para fichar hay que abrir tres candados. En el editor están los datos: edad = 15 y altura = 140. Cada candado se abre con candado(numero, True o False): el 1 pide una edad mayor de 12, el 2 una altura de 130 o más y el 3 las dos condiciones a la vez con and.',
  hint:
    'Pásale a candado() el resultado de una comparación: edad > 12, altura >= 130 y, en el tercero, las dos unidas con and para que sea True solo si se cumplen ambas. Consigue 3 estrellas con 6 líneas o menos.',
  starter: [
    '# El piloto: 15 años y 140 cm de altura.',
    'edad = 15',
    'altura = 140',
    '# Abre los tres candados con comparaciones.',
  ].join('\n'),
  solution: [
    'edad = 15',
    'altura = 140',
    'candado(1, edad > 12)',
    'candado(2, altura >= 130)',
    'candado(3, edad > 12 and altura >= 130)',
  ].join('\n'),
  par: 6,
  sceneTitle: 'La puerta blindada',
  success: 'Los tres candados han cedido.',
  Scene: LocksScene,
  start() {
    const locks = createLocks()

    return {
      api: createLocksApi(locks),
      finish() {
        return { ...judgeLocks(locks), steps: [locksStep(locks)] }
      },
    }
  },
}
