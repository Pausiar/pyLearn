import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect, truncate } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface ShopView {
  questions: string[]
  message: string
}

function drawShop(context: CanvasRenderingContext2D, view: ShopView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#241b2f')
  rect(context, 0, 96, WIDTH, 32, '#2e2338')
  rect(context, 0, 86, WIDTH, 10, '#7a4b2a')

  rect(context, 20, 58, 26, 28, '#4aa8ff')
  rect(context, 25, 46, 16, 14, '#f0c9a0')
  rect(context, 25, 44, 16, 5, '#5c3a1c')

  if (view.questions.length === 0) {
    label(context, 'El cliente espera tus preguntas.', 60, 40, 9, '#b9a8c9')
  }

  view.questions.slice(0, 2).forEach((question, index) => {
    const y = 14 + index * 30
    rect(context, 58, y, 152, 24, '#f2f2f5')
    label(context, truncate(question, 24), 64, y + 16, 9, '#1d1d1f')
  })

  rect(context, 148, 62, 68, 22, '#12303a')
  context.strokeStyle = '#2a5468'
  context.lineWidth = 2
  context.strokeRect(149, 63, 66, 20)
  label(context, truncate(view.message === '' ? 'caja vacía' : view.message, 18), 154, 77, 9, view.message === '' ? '#5f7f8a' : '#8fd3a6')
}

/** Lienzo de la tienda: el cliente responde y la caja muestra el total. */
export function ShopScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<ShopView>({ questions: [], message: '' })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawShop(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'shop') continue
      if (!aliveRef.current) return
      setView({ questions: step.questions, message: step.message })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ questions: [], message: '' })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.message === ''
      ? `El cliente ha respondido a ${view.questions.length} preguntas.`
      : `El cliente ha respondido a ${view.questions.length} preguntas. La caja dice: ${view.message}.`

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
