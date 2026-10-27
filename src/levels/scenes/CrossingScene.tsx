import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface CrossingView {
  redCrossed: boolean
  redWaited: boolean
  greenCrossed: boolean
  greenWaited: boolean
}

function state(crossed: boolean, waited: boolean): string {
  if (crossed) return 'cruzó'
  return waited ? 'esperó' : 'no hizo nada'
}

function drawCrossing(context: CanvasRenderingContext2D, view: CrossingView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#101828')
  rect(context, 0, 74, WIDTH, 10, '#2a3350')
  rect(context, 0, 84, WIDTH, 26, '#232a3d')
  for (let index = 0; index < 5; index += 1) {
    rect(context, 74 + index * 22, 84, 12, 26, '#e8e8ee')
  }
  rect(context, 0, 110, WIDTH, 18, '#2a3350')

  rect(context, 16, 22, 20, 48, '#2a3350')
  rect(context, 21, 27, 10, 10, view.greenCrossed || view.greenWaited ? '#5a6273' : '#e05263')
  rect(context, 21, 45, 10, 10, '#5a6273')
  rect(context, 21, 63, 10, 10, view.greenCrossed ? '#30d158' : '#5a6273')

  const x = view.greenCrossed ? 178 : 50
  rect(context, x - 5, 48, 10, 18, '#4aa8ff')
  rect(context, x - 5, 66, 10, 8, '#f0c9a0')

  label(context, `Luz roja: ${state(view.redCrossed, view.redWaited)}`, 52, 34, 9, '#e8f1ff')
  label(context, `Luz verde: ${state(view.greenCrossed, view.greenWaited)}`, 52, 54, 9, '#e8f1ff')
  label(context, 'PASO DE PEATONES', 178, 124, 8, '#7f8db8')
}

/** Lienzo del semáforo: qué hizo el peatón con cada luz. */
export function CrossingScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<CrossingView>({
    redCrossed: false,
    redWaited: false,
    greenCrossed: false,
    greenWaited: false,
  })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawCrossing(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'crossing') continue
      if (!aliveRef.current) return
      setView({
        redCrossed: step.redCrossed,
        redWaited: step.redWaited,
        greenCrossed: step.greenCrossed,
        greenWaited: step.greenWaited,
      })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 400)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ redCrossed: false, redWaited: false, greenCrossed: false, greenWaited: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = `Con la luz roja el peatón ${state(view.redCrossed, view.redWaited)}. Con la luz verde ${state(view.greenCrossed, view.greenWaited)}.`

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
