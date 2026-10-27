import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface PizzeriaView {
  queue: string[]
  served: string | null
}

function drawPizzeria(context: CanvasRenderingContext2D, view: PizzeriaView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1a1420')
  rect(context, 120, 20, 96, 84, '#2b2135')
  rect(context, 120, 20, 96, 6, '#3d2f4a')

  label(context, 'COLA DE PEDIDOS', 12, 22, 8, '#d8a3a3')
  view.queue.forEach((name, index) => {
    const y = 30 + index * 20
    rect(context, 12, y, 96, 17, '#3b2b3f')
    rect(context, 12, y, 4, 17, '#c98a3c')
    label(context, name, 24, y + 12, 9, '#fbe9d0')
  })

  if (view.queue.length === 0) label(context, 'sin pedidos', 24, 50, 9, '#7f6f86')

  label(context, 'SERVIDA', 138, 40, 8, '#9fd7a8')
  rect(context, 132, 50, 72, 44, view.served === null ? '#2b2135' : '#1f5c38')
  label(
    context,
    view.served === null ? '· · ·' : view.served,
    168,
    78,
    11,
    view.served === null ? '#6b7592' : '#eaf7ee',
    'center',
  )

  label(context, 'PIZZERÍA DE NEÓN', WIDTH - 10, 122, 8, '#8a7590', 'right')
}

/** Lienzo de la pizzería: la cola que queda y la pizza que sale del horno. */
export function PizzeriaScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<PizzeriaView>({ queue: [], served: null })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawPizzeria(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'pizzeria') continue
      if (!aliveRef.current) return
      setView({ queue: step.queue, served: step.served })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ queue: [], served: null })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.queue.length === 0
      ? 'La cocina todavía no ha recibido la cola de pedidos.'
      : `La cola que llega a la cocina es ${view.queue.join(', ')}.${view.served === null ? '' : ` Se ha servido ${view.served}.`}`

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
