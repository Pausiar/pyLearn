import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface BackpackView {
  ropes: number
  canteens: number
  placed: boolean
}

function drawBackpack(context: CanvasRenderingContext2D, view: BackpackView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1d2633')
  rect(context, 0, 104, WIDTH, 24, '#161d27')

  rect(context, 48, 30, 52, 12, '#5c3a1c')
  rect(context, 34, 40, 80, 66, '#8a5a2b')
  rect(context, 34, 40, 80, 12, '#a9713a')
  rect(context, 34, 58, 80, 6, '#5c3a1c')
  rect(context, 60, 72, 30, 24, '#a9713a')
  rect(context, 60, 72, 30, 4, '#5c3a1c')
  rect(context, 71, 82, 8, 6, '#d9b44a')

  label(context, 'CUERDAS', 118, 48, 8, '#9aa8c2')
  rect(context, 188, 40, 12, 12, '#b07a3c')
  label(context, String(view.ropes), 214, 49, 13, '#e8f1ff', 'right')

  label(context, 'CANTIMPLORAS', 118, 78, 8, '#9aa8c2')
  rect(context, 188, 70, 12, 12, '#4aa8ff')
  label(context, String(view.canteens), 214, 79, 13, '#e8f1ff', 'right')

  label(context, view.placed ? 'Mochila preparada' : 'Mochila vacía', 118, 104, 8, view.placed ? '#8fd3a6' : '#9aa8c2')
}

/** Lienzo de la mochila: muestra lo que lleva el explorador. */
export function BackpackScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<BackpackView>({ ropes: 0, canteens: 0, placed: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawBackpack(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'backpack') continue
      if (!aliveRef.current) return
      setView({ ropes: step.ropes, canteens: step.canteens, placed: step.placed })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ ropes: 0, canteens: 0, placed: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.placed
    ? `La mochila lleva ${view.ropes} cuerdas y ${view.canteens} cantimploras.`
    : 'La mochila está vacía.'

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
