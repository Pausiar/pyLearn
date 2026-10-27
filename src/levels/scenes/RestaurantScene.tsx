import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface RestaurantView {
  trace: { action: string; ingrediente: string }[]
  served: string[]
  done: boolean
}

function count(view: RestaurantView, actions: string[]): number {
  return view.trace.filter((entry) => actions.includes(entry.action)).length
}

function drawRestaurant(context: CanvasRenderingContext2D, view: RestaurantView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1d2633')
  rect(context, 0, 72, WIDTH, 56, '#191f2c')

  label(context, 'COCINA', 10, 16, 8, '#9aa8c2')

  const stations = [
    { name: 'PICAR', value: count(view, ['picar']), colour: '#d9b44a' },
    { name: 'FUEGO', value: count(view, ['hervir', 'hornear']), colour: '#e05263' },
    { name: 'SERVIR', value: view.served.length, colour: '#8fd3a6' },
  ]

  stations.forEach((station, index) => {
    const x = 10 + index * 70
    rect(context, x, 24, 64, 44, '#252c42')
    rect(context, x, 24, 64, 3, '#33405c')
    label(context, station.name, x + 8, 40, 8, station.colour)
    label(context, String(station.value), x + 8, 60, 14, '#e8f1ff')
  })

  label(context, 'ÚLTIMOS PASOS', 10, 84, 8, '#9aa8c2')

  const last = view.trace.slice(-3)
  if (last.length === 0) {
    label(context, 'sin empezar', 10, 98, 8, '#7f8db8')
  } else {
    last.forEach((entry, index) => {
      label(context, `${entry.action} ${entry.ingrediente}`, 10, 98 + index * 10, 8, '#c9d4e4')
    })
  }

  label(
    context,
    `Servidos: ${view.served.length === 0 ? 'nada' : view.served.join(', ')}`,
    WIDTH - 10,
    16,
    8,
    view.done ? '#8de08f' : '#9aa8c2',
    'right',
  )
}

/** Lienzo de la cocina: las estaciones, los últimos pasos y los platos servidos. */
export function RestaurantScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<RestaurantView>({ trace: [], served: [], done: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawRestaurant(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'restaurant') continue
      if (!aliveRef.current) return
      setView({ trace: step.trace, served: step.served, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 300)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ trace: [], served: [], done: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = `La cocina ha servido ${view.served.length === 0 ? 'nada' : view.served.join(', ')} con ${view.trace.length} pasos.${
    view.done ? ' El servicio ha terminado.' : ''
  }`

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
