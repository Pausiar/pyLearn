import type { ComponentType, Ref } from 'react'
import type { SceneHandle, SceneStep } from '../engine/scene'
import type { RunResult } from '../interp/run'
import type { Api } from '../interp/types'

export interface LevelVerdict {
  complete: boolean
  missing: string
}

export interface LevelOutcome extends LevelVerdict {
  steps: SceneStep[]
}

export interface LevelSession {
  api: Api
  /**
   * Decide el resultado y devuelve la traza que el lienzo tiene que reproducir.
   * Recibe el código para los niveles que se juzgan en más de una situación
   * (el semáforo en rojo y en verde, los tres pases del guardián).
   */
  finish(result: RunResult, code: string): LevelOutcome
}

/** Un lienzo de nivel: React 19 pasa `ref` como una prop más. */
export type SceneComponent = ComponentType<{ ref?: Ref<SceneHandle> }>

export interface PlayableLevel {
  id: number
  title: string
  concept: string
  story: string
  hint: string
  starter: string
  solution: string
  /** Líneas para conseguir las 3 estrellas. */
  par: number
  /** Título del panel del lienzo. */
  sceneTitle: string
  /** Qué se cuenta al terminar. */
  success: string
  Scene: SceneComponent
  start(): LevelSession
}
