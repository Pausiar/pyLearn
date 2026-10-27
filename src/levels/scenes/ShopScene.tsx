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

const RESTING: ShopView = { questions: [], message: '' }

function ease(value: number): number {
  const x = Math.min(Math.max(value, 0), 1)
  return 1 - (1 - x) ** 3
}

function drawBubble(context: CanvasRenderingContext2D, text: string, pop: number): void {
  const width = Math.min(104, text.length * 6 + 16)
  const x = 118
  const y = 18
  context.globalAlpha = pop
  rect(context, x, y, width, 22, '#ffffff')
  rect(context, x, y + 20, width, 2, '#c8c8d0')
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.moveTo(x + 12, y + 22)
  context.lineTo(x + 20, y + 22)
  context.lineTo(x + 14, y + 28)
  context.closePath()
  context.fill()
  label(context, text, x + 8, y + 14, 8, '#1d1d1f')
  context.globalAlpha = 1
}

function drawShop(context: CanvasRenderingContext2D, view: ShopView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#f0ece2')
  rect(context, 0, 100, WIDTH, 28, '#d9d2c2')
  rect(context, 0, 100, WIDTH, 2, '#c4bba6')

  // Mostrador de madera con sombra y caja registradora.
  rect(context, 20, 62, 120, 40, '#7a5a3a')
  rect(context, 20, 62, 120, 4, '#5e4329')
  rect(context, 20, 102, 120, 4, 'rgba(0,0,0,0.15)')
  rect(context, 30, 40, 60, 22, '#3a4150')
  rect(context, 30, 40, 60, 4, '#2a303d')
  rect(context, 34, 46, 52, 8, '#9bffb0')

  // Monedas: caen en la bandeja y se acumulan hasta el total anunciado.
  const total = view.message.match(/\d+/)
  const coins = total ? Math.min(Number(total[0]), 12) : 0
  for (let index = 0; index < coins; index += 1) {
    const age = reduced ? 1 : ease((elapsed - index * 140) / 300)
    if (age <= 0) continue
    const drop = (1 - age) * -16
    context.fillStyle = '#ffd86a'
    context.beginPath()
    context.arc(48 + index * 9, 58 + drop, 3.5, 0, Math.PI * 2)
    context.fill()
  }
  label(context, total ? `${total[0]} monedas` : '— monedas', 60, 70, 8, '#1d1d1f', 'center')

  // Cliente: silueta en planos que se mece un poco.
  const bob = reduced ? 0 : Math.sin(elapsed / 500) * 1
  rect(context, 160, 52 + bob, 18, 18, '#e8c39e')
  rect(context, 158, 48 + bob, 22, 5, '#5a3e2b')
  rect(context, 156, 72 + bob, 26, 30, '#3b6b8f')
  rect(context, 156, 72 + bob, 4, 30, '#2d5472')

  // Globo: la última pregunta, o «¡Gracias!» cuando la caja ya ha cobrado.
  if (view.message !== '') {
    drawBubble(context, '¡Gracias!', reduced ? 1 : ease(elapsed / 200))
  } else if (view.questions.length > 0) {
    const last = view.questions.at(-1) ?? ''
    drawBubble(context, truncate(last, 16), reduced ? 1 : ease(elapsed / 200))
  } else {
    label(context, 'Espero tus preguntas', 60, 40, 9, '#b9a8c9')
  }

  // Caja: muestra el último mensaje de la caja.
  rect(context, 148, 62, 68, 22, '#12303a')
  context.strokeStyle = '#2a5468'
  context.lineWidth = 2
  context.strokeRect(149, 63, 66, 20)
  label(
    context,
    truncate(view.message === '' ? 'caja vacía' : view.message, 18),
    154,
    77,
    9,
    view.message === '' ? '#5f7f8a' : '#8fd3a6',
  )
}

/** Lienzo de la tienda: el cliente habla con cada input() y la caja cobra las monedas. */
export function ShopScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<ShopView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawShop(context, view, now - bornRef.current, reduced)
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
      if (step.kind !== 'shop') continue
      if (!aliveRef.current) return
      setView({ questions: step.questions, message: step.message })
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
