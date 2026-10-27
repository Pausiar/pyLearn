import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2
const MAX_LIFE = 3

interface ForgeView {
  hero: { nombre: string; vida: number; pasos: number } | null
  log: string[]
  done: boolean
}

function drawForge(context: CanvasRenderingContext2D, view: ForgeView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#141a26')
  rect(context, 0, 0, WIDTH, 18, '#1f2736')
  label(context, 'TU MINIJUEGO', 8, 6, 10, '#ffd479')
  label(context, view.done ? 'partida completa' : 'partida en marcha', 216, 6, 9, view.done ? '#8fd3a6' : '#9aa8c2', 'right')

  const hero = view.hero
  const name = hero?.nombre ?? 'sin héroe'
  const life = hero?.vida ?? 0
  const steps = hero?.pasos ?? 0

  rect(context, 12, 28, 92, 84, '#1f2736')
  label(context, 'HÉROE', 20, 40, 9, '#8fb7ff')
  label(context, name.toUpperCase(), 20, 58, 11, '#e8f1ff')

  label(context, 'vida', 20, 72, 9, '#9aa8c2')
  for (let index = 0; index < MAX_LIFE; index += 1) {
    rect(context, 20 + index * 18, 76, 14, 12, index < life ? '#e7777b' : '#3a3450')
  }

  label(context, 'pasos', 20, 98, 9, '#9aa8c2')
  label(context, String(steps), 96, 98, 11, '#ffe9a8', 'right')

  rect(context, 112, 28, 100, 84, '#1f2736')
  label(context, 'LO QUE PASA', 120, 40, 9, '#8fb7ff')

  view.log.slice(-4).forEach((line, index) => {
    label(context, line, 120, 56 + index * 14, 9, '#cfe0ff')
  })

  label(context, 'el motor llama a crear() y a mover()', 12, 122, 9, '#9aa8c2')
}

/** Lienzo del jefe final: el héroe y el registro de la partida que juega el motor. */
export function ForgeScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<ForgeView>({ hero: null, log: [], done: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawForge(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'forge') continue
      if (!aliveRef.current) return
      setView({ hero: step.hero, log: step.log, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ hero: null, log: [], done: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.hero === null
      ? 'El motor todavía no ha jugado al minijuego.'
      : `El motor juega con ${view.hero.nombre}: ${view.hero.vida} de vida y ${view.hero.pasos} pasos.`

  return (
    <div className="field">
      <canvas
        ref={canvasRef}
        className="field__canvas field__canvas--smooth"
        width={WIDTH * SCALE}
        height={HEIGHT * SCALE}
        role="img"
        aria-label={description}
      />
      <p className="field__caption" aria-hidden="true">
        {description}
      </p>
    </div>
  )
}
