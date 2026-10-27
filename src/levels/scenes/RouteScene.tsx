import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { ROUTE_HOUSES } from '../../engine/route'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface RouteView {
  delivered: string[]
}

function drawRoute(context: CanvasRenderingContext2D, view: RouteView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#101828')
  rect(context, 0, 100, WIDTH, 28, '#232a3d')
  rect(context, 0, 96, WIDTH, 4, '#3a4a5e')

  ROUTE_HOUSES.forEach((house, index) => {
    const x = 10 + index * 54
    const entregado = view.delivered.includes(house)

    context.fillStyle = entregado ? '#2f6f3a' : '#3b4761'
    context.beginPath()
    context.moveTo(x - 4, 52)
    context.lineTo(x + 18, 34)
    context.lineTo(x + 40, 52)
    context.closePath()
    context.fill()

    rect(context, x, 52, 36, 46, entregado ? '#3f8a4c' : '#4a5771')
    rect(context, x + 12, 74, 12, 24, '#1b2231')

    if (entregado) {
      rect(context, x + 8, 8, 20, 18, '#c98a3c')
      rect(context, x + 8, 8, 20, 5, '#e0a95c')
      label(context, '✓', x + 18, 84, 12, '#eaf7ee', 'center')
    }

    label(context, house, x + 18, 114, 9, entregado ? '#bdf0c4' : '#8f9bb8', 'center')
    label(context, entregado ? 'entregado' : 'espera', x + 18, 124, 7, '#6b7592', 'center')
  })

  label(context, `Paquetes entregados: ${view.delivered.length}`, WIDTH - 10, 132, 8, '#7f8db8', 'right')
}

/** Lienzo de la ruta: qué casas tienen ya su paquete. */
export function RouteScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<RouteView>({ delivered: [] })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawRoute(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'route') continue
      if (!aliveRef.current) return
      setView({ delivered: step.delivered })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 380)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ delivered: [] })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.delivered.length === 0
      ? 'El repartidor todavía no ha entregado ningún paquete.'
      : `Paquetes entregados en ${view.delivered.join(', ')}.`

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
