import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { ROCKET_FUEL, ROCKET_TANKS } from '../../engine/rocket'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2
const MAX_GAUGE = 84

interface RocketView {
  fuel: number
  sent: boolean
}

const RESTING: RocketView = { fuel: 0, sent: false }

function drawHangar(context: CanvasRenderingContext2D): void {
  rect(context, 0, 0, WIDTH, HEIGHT, '#0e1420')
  rect(context, 0, 100, WIDTH, 28, '#1a2232')
  rect(context, 0, 100, WIDTH, 2, '#2c3648')
}

function drawGauge(context: CanvasRenderingContext2D, fuel: number, sent: boolean): void {
  // Siete tanques en fila, cada uno con su nivel; la cifra enviada rellena el depósito entero.
  const fill = Math.min(fuel, MAX_GAUGE) / MAX_GAUGE
  const colour = !sent ? '#4a5575' : fuel === ROCKET_FUEL ? '#4ce07a' : fuel > ROCKET_FUEL ? '#ff7b6b' : '#ffd86a'
  for (let tank = 0; tank < ROCKET_TANKS; tank += 1) {
    const x = 30 + tank * 20
    rect(context, x, 40, 16, 44, '#1d2638')
    const level = sent ? Math.max(0, Math.min(1, fill * ROCKET_TANKS - tank)) : 0
    rect(context, x + 2, 42 + (40 - level * 40), 12, level * 40, colour)
    rect(context, x, 40, 16, 2, '#3a4560')
  }
  label(context, sent ? `${fuel} t` : '— t', 112, 30, 10, '#e8f1ff', 'center')
}

function drawRocket(context: CanvasRenderingContext2D, view: RocketView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)
  drawHangar(context)

  drawGauge(context, view.fuel, view.sent)

  // El cohete sube unos píxeles si la torre confirma la cifra exacta.
  const confirmed = view.sent && view.fuel === ROCKET_FUEL
  const lift = confirmed ? (reduced ? 18 : Math.min(elapsed / 600, 1) * 18) : 0
  const cx = 186
  const base = 92 - lift
  rect(context, cx - 8, base - 40, 16, 40, '#f2f2f5')
  rect(context, cx - 8, base - 40, 4, 40, '#c9c9d4')
  rect(context, cx - 3, base - 46, 6, 6, '#e05263')
  rect(context, cx - 12, base - 22, 4, 14, '#e05263')
  rect(context, cx + 8, base - 22, 4, 14, '#e05263')
  if (confirmed && !reduced) {
    const flame = Math.sin(elapsed / 60) * 2
    rect(context, cx - 4, base + 1, 8, 4 + flame, '#ffb36b')
  }

  // Cuenta atrás al confirmar: 3, 2, 1, despegue.
  if (confirmed) {
    const stage = reduced ? 3 : Math.min(Math.floor(elapsed / 700), 3)
    const text = ['3', '2', '1', '¡DESPEGUE!'][stage]
    label(context, text, 112, 74, stage === 3 ? 9 : 14, '#4ce07a', 'center')
  }

  if (view.sent && !confirmed) {
    rect(context, 14, 84, 92, 12, '#2a1d24')
    label(
      context,
      view.fuel > ROCKET_FUEL ? 'Revisa la resta' : 'Falta combustible',
      60,
      93,
      8,
      '#ffb3bb',
      'center',
    )
  }
}

/** Lienzo del cohete: el depósito se llena con la cifra de la torre y despega si es la exacta. */
export function RocketScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<RocketView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawRocket(context, view, now - bornRef.current, reduced)
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
      if (step.kind !== 'rocket') continue
      if (!aliveRef.current) return
      setView({ fuel: step.fuel, sent: step.sent })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 480)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.sent
    ? `La torre ha recibido ${view.fuel} toneladas.`
    : 'La torre sigue esperando.'

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
