import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { ORDERS } from '../../engine/oven'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface OvenView {
  baked: { sabor: string; cantidad: number }[]
  done: boolean
}

function bakedCount(view: OvenView, sabor: string): number {
  return view.baked
    .filter((order) => order.sabor === sabor)
    .reduce((total, order) => total + order.cantidad, 0)
}

function drawOven(context: CanvasRenderingContext2D, view: OvenView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#241a20')
  rect(context, 0, 108, WIDTH, 20, '#1b1420')

  label(context, 'TICKET DEL DÍA', 10, 16, 8, '#b9a8c2')

  ORDERS.forEach((order, index) => {
    const y = 28 + index * 26
    const done = bakedCount(view, order.sabor)
    rect(context, 8, y, 106, 22, done >= order.cantidad ? '#2f4a3a' : '#33303f')
    label(context, `${order.cantidad} ${order.sabor}`, 14, y + 15, 8, '#e8eef5')
    label(context, `${done}/${order.cantidad}`, 108, y + 15, 8, '#d9b44a', 'right')
  })

  rect(context, 122, 20, 92, 92, '#33303f')
  rect(context, 122, 20, 92, 4, '#4a4560')
  rect(context, 130, 36, 76, 60, '#20263a')

  const total = Math.min(
    view.baked.reduce((sum, order) => sum + order.cantidad, 0),
    6,
  )
  for (let index = 0; index < total; index += 1) {
    const column = index % 3
    const row = Math.floor(index / 3)
    const x = 142 + column * 19
    const y = 48 + row * 20
    rect(context, x, y, 14, 14, '#d9b44a')
    rect(context, x + 2, y + 2, 10, 10, '#e05263')
  }

  label(context, view.done ? 'Tanda completa' : 'Horno encendido', 10, 122, 8, view.done ? '#8fd3a6' : '#9aa8c2')
}

/** Lienzo del horno: el ticket del día y las pizzas que van saliendo. */
export function OvenScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<OvenView>({ baked: [], done: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawOven(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'oven') continue
      if (!aliveRef.current) return
      setView({ baked: step.baked, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 340)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ baked: [], done: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const baked = ORDERS.map((order) => `${bakedCount(view, order.sabor)} de ${order.sabor}`).join(', ')
  const description = view.done
    ? `Tanda completa: ${baked}.`
    : `El horno lleva ${baked}.`

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
