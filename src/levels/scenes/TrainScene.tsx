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

const RESTING: TrainView = { loads: [], sent: false }

const COLOUR: Record<string, string> = {
  carbón: '#3a3a44',
  madera: '#8a5a2b',
  agua: '#4aa8ff',
  ganado: '#c9a06a',
  correo: '#e05263',
  fruta: '#ffb04a',
  vacío: '#2b3546',
}

function drawWagon(context: CanvasRenderingContext2D, x: number, load: string, index: number): void {
  const empty = load === 'vacío'
  // Vagón en planos: sombra, cuerpo con cara clara, ruedas y el índice debajo.
  rect(context, x + 1, 47, 28, 42, '#0a0f1c')
  rect(context, x, 44, 28, 42, COLOUR[load] ?? '#5a6273')
  rect(context, x, 44, 28, 6, empty ? '#39465c' : '#ffffff22')
  rect(context, x + 4, 74, 6, 8, '#1b2231')
  rect(context, x + 18, 74, 6, 8, '#1b2231')
  label(context, load, x + 14, 66, 7, empty ? '#8f9bb8' : '#ffe9c8', 'center')
  label(context, String(index), x + 14, 110, 7, '#c9d0e4', 'center')
}

function drawTrain(context: CanvasRenderingContext2D, view: TrainView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#11161f')
  rect(context, 0, 92, WIDTH, 6, '#3a4a5e')
  rect(context, 0, 98, WIDTH, 30, '#232c3a')

  // La locomotora sale por la derecha al enviar el tren.
  const travel = view.sent && !reduced ? Math.min(elapsed / 1200, 1) : view.sent ? 1 : 0
  const offset = travel * 60
  view.loads.forEach((load, index) => drawWagon(context, 6 + index * 30 + offset, load, index))

  if (view.loads.length > 0) {
    const lx = 6 + view.loads.length * 30 + offset
    rect(context, lx, 66, 22, 20, '#2e3441')
    rect(context, lx + 2, 52, 10, 14, '#4a5268')
    rect(context, lx + 14, 60, 6, 6, '#ffe08a')
  }

  label(
    context,
    view.sent ? 'El tren ha llegado a la estación' : 'El tren espera en la estación',
    WIDTH / 2,
    122,
    8,
    view.sent ? '#8de08f' : '#8f9bb8',
    'center',
  )
}

/** Lienzo de la estación: los vagones con su índice y la locomotora que sale al enviar. */
export function TrainScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<TrainView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawTrain(context, view, now - bornRef.current, reduced)
        if (!reduced) frame = window.requestAnimationFrame(tick)
      }
      tick(performance.now())
    }

    return () => {
      aliveRef.current = false
      window.cancelAnimationFrame(frame)
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'train') continue
      if (!aliveRef.current) return
      setView({ loads: step.loads, sent: step.sent })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 480)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
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
