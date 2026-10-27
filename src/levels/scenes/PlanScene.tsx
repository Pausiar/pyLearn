import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { PLAN_LINES } from '../../engine/plan'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect, truncate } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface PlanView {
  lines: string[]
  done: boolean
}

const RESTING: PlanView = { lines: [], done: false }

function drawPlan(context: CanvasRenderingContext2D, view: PlanView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  // Cielo en franjas: de día claro a noche morada cuando el plan está completo.
  rect(context, 0, 0, WIDTH, 50, view.done ? '#2b2150' : '#2a3f6b')
  rect(context, 0, 50, WIDTH, 30, view.done ? '#4a3266' : '#5a7fb0')

  // Campo en planos: franja clara arriba y surcos debajo.
  rect(context, 0, 80, WIDTH, 48, '#2f6b3a')
  rect(context, 0, 80, WIDTH, 3, '#3f8a4c')
  for (let row = 0; row < 4; row += 1) rect(context, 14 + row * 50, 100, 26, 2, '#245a2e')

  // El sol sube en arco con cada línea escrita; al completar el plan, se pone.
  const count = view.lines.length
  const k = count === 0 ? 0 : 0.25 + (count / PLAN_LINES.length) * 0.6
  const sunX = 24 + k * 180
  const sunY = 70 - Math.sin(Math.PI * k) * 52
  const pulse = reduced ? 0 : Math.sin(elapsed / 400) * 1
  context.fillStyle = view.done ? '#ffb27a' : '#ffe08a'
  context.beginPath()
  context.arc(sunX, sunY, 9 + pulse, 0, Math.PI * 2)
  context.fill()

  // Panel tipo terminal: cada línea aparece con un ligero retraso.
  rect(context, 14, 14, 196, 56, 'rgba(10,18,38,0.85)')
  context.strokeStyle = '#2b3550'
  context.lineWidth = 2
  context.strokeRect(15, 15, 194, 54)
  if (count === 0) {
    const blink = reduced || Math.sin(elapsed / 300) > 0
    if (blink) label(context, '> _', 22, 30, 9, '#7f8db8')
  }
  view.lines.forEach((line, index) => {
    const age = reduced ? 1 : Math.min((elapsed - index * 350) / 260, 1)
    if (age <= 0) return
    context.globalAlpha = age
    label(context, truncate(`> ${line}`, 26), 22, 30 + index * 14, 9, '#e8f1ff')
    context.globalAlpha = 1
  })

  // Un brote por cada línea escrita.
  for (let index = 0; index < count; index += 1) {
    const bx = 30 + index * 60
    rect(context, bx, 92, 4, 8, '#9be38f')
    rect(context, bx - 2, 90, 8, 3, '#7ccf75')
  }
}

/** Lienzo del plan: el sol sube con cada línea que imprime el programa. */
export function PlanScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<PlanView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawPlan(context, view, now - bornRef.current, reduced)
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
      if (step.kind !== 'plan') continue
      if (!aliveRef.current) return
      setView({ lines: step.lines, done: step.done })
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
    view.lines.length === 0
      ? 'El plan está en blanco.'
      : `El plan dice: ${view.lines.join(', ')}.${view.done ? ' Jornada completa.' : ''}`

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
