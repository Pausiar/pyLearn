import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { SALES } from '../../engine/vending'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface VendingView {
  sales: { producto: string; precio: number; pago: number; cambio: number }[]
  done: boolean
}

function drawVending(context: CanvasRenderingContext2D, view: VendingView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#101828')
  rect(context, 8, 8, 124, 112, '#232a3d')
  rect(context, 8, 8, 124, 4, '#2f3850')

  label(context, 'EXPENDEDORA', 16, 26, 8, '#9aa8c2')

  SALES.forEach((sale, index) => {
    const y = 36 + index * 26
    const sold = view.sales[index]
    rect(context, 16, y, 108, 22, sold ? '#2f4a3a' : '#2b3346')
    label(context, sale.producto, 22, y + 15, 8, '#e8f1ff')
    label(context, `${sale.precio} con ${sale.pago}`, 118, y + 15, 8, '#c9d4e4', 'right')
  })

  label(context, 'CAMBIO', 148, 26, 8, '#9aa8c2')

  SALES.forEach((sale, index) => {
    const y = 42 + index * 26
    const sold = view.sales[index]
    label(context, sale.producto, 148, y, 7, '#7f8db8')
    if (sold) {
      label(context, String(sold.cambio), 148, y + 15, 13, '#8fd3a6')
      rect(context, 200, y + 4, 11, 11, '#d9b44a')
    } else {
      label(context, '—', 148, y + 15, 13, '#4a5568')
    }
  })

  label(context, view.done ? 'Todo vendido' : 'En servicio', 16, 122, 8, view.done ? '#8fd3a6' : '#7f8db8')
}

/** Lienzo de la expendedora: las tres ventas y el cambio que devuelve cada una. */
export function VendingScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<VendingView>({ sales: [], done: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawVending(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'vending') continue
      if (!aliveRef.current) return
      setView({ sales: step.sales, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 360)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ sales: [], done: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const changes = view.sales.map((sale) => `${sale.producto}: ${sale.cambio}`).join(', ')
  const description =
    view.sales.length === 0
      ? 'La expendedora tiene tres ventas esperando.'
      : `Cambios devueltos: ${changes}.${view.done ? ' Las tres ventas están cobradas.' : ''}`

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
