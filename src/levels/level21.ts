import { createRobot, createRobotApi, judgeRobot, robotSteps } from '../engine/robot'
import { RobotScene } from './scenes/RobotScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_21: PlayableLevel = {
  id: 21,
  title: 'El truco nuevo',
  concept: 'def y llamadas',
  story:
    'El robot de la pista no entiende órdenes sueltas: solo ejecuta trucos aprendidos. Hay tres vallas, en las casillas 2, 5 y 8, y la meta está en la casilla 9. Escribe una función saltar_valla() que avance un paso y salte la valla — con avanzar() y saltar() dentro — y enséñasela al robot con aprender(saltar_valla). Después dale la salida con correr(): repetirá tu truco en cada valla.',
  hint:
    'Una función se define con def nombre(): y las órdenes de dentro van con sangría. Se pasa a aprender() por su nombre, sin paréntesis. Consigue 3 estrellas con 5 líneas o menos.',
  starter: [
    '# El robot solo repite trucos aprendidos, no órdenes sueltas.',
    '# Escribe def saltar_valla(): con avanzar() y saltar() dentro,',
    '# y enséñaselo al robot con aprender(saltar_valla).',
  ].join('\n'),
  solution: [
    'def saltar_valla():',
    '    avanzar()',
    '    saltar()',
    '',
    'aprender(saltar_valla)',
    'correr()',
  ].join('\n'),
  par: 6,
  sceneTitle: 'La pista de vallas',
  success: 'El robot repite tu truco en las tres vallas.',
  Scene: RobotScene,
  start() {
    const robot = createRobot()

    return {
      api: createRobotApi(robot),
      finish() {
        return { ...judgeRobot(robot), steps: robotSteps(robot) }
      },
    }
  },
}
