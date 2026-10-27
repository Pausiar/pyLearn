import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface TrainView {
  loads: string[]
  sent: boolean
}

function drawTrain(context: CanvasRenderingContext2D, view: TrainView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#14202e')
  rect(context, 0, 92, WIDTH, 6, '#3a4a5e')
  rect(context, 0, 98, WIDTH, 30, '#232c3a')

  view.loads.forEach((load, index) => {
    const x = 6 + index * 30
    const vacio = load === 'vacío'
    const body = vacio ? '#2b3546' : '#8a5a2b'

    rect(context, x, 44, 28, 42, body)
    rect(context, x, 44, 28, 6, vacio ? '#39465c' : '#a9713a')
    rect(context, x + 4, 74, 6, 8, '#1b2231')
    rect(context, x + 18, 74, 6, 8, '#1b2231')
    label(context, load, x + 14, 66, 7, vacio ? '#8f9bb8' : '#ffe9c8', 'center')
  })

  label(
    context,
    view.sent ? 'El tren ha llegado a la estación' : 'El tren espera en la estación',
    WIDTH / 2,
    118,
    9,
    view.sent ? '#8de08f' : '#8f9bb8',
    'center',
  )
}

/** Lienzo de la estación: los vagones del tren y la carga de cada uno. */
export function TrainScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<TrainView>({ loads: [], sent: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawTrain(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'train') continue
      if (!aliveRef.current) return
      setView({ loads: step.loads, sent: step.sent })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ loads: [], sent: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.loads.length === 0
      ? 'El tren todavía no ha salido de la estación.'
      : `El tren lleva ${view.loads.length} vagones: ${view.loads.join(', ')}.${view.sent ? ' Ya ha llegado.' : ''}`

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
