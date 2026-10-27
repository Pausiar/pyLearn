import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2
const SLOTS = 6

interface BackpackView {
  ropes: number
  canteens: number
  placed: boolean
}

const RESTING: BackpackView = { ropes: 0, canteens: 0, placed: false }

function ease(value: number): number {
  const x = Math.min(Math.max(value, 0), 1)
  return 1 - (1 - x) ** 3
}

function drawRope(context: CanvasRenderingContext2D, x: number, y: number, drop: number): void {
  context.strokeStyle = '#c8a064'
  context.lineWidth = 2
  context.beginPath()
  context.arc(x, y + drop, 7, 0, Math.PI * 2)
  context.stroke()
  context.beginPath()
  context.arc(x, y + drop, 3, 0, Math.PI * 2)
  context.stroke()
  rect(context, x + 6, y + drop - 1, 4, 2, '#c8a064')
}

function drawCanteen(context: CanvasRenderingContext2D, x: number, y: number, drop: number): void {
  rect(context, x - 6, y + drop - 2, 12, 16, '#4aa3ff')
  rect(context, x - 6, y + drop - 2, 12, 3, '#2f7fd6')
  rect(context, x - 2, y + drop - 6, 4, 4, '#8a8f9c')
  rect(context, x - 6, y + drop + 8, 12, 2, '#2f7fd6')
}

function drawBackpack(
  context: CanvasRenderingContext2D,
  view: BackpackView,
  elapsed: number,
  reduced: boolean,
): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#f0ece2')
  rect(context, 0, 110, WIDTH, 18, '#d9d2c2')
  rect(context, 0, 110, WIDTH, 2, '#c4bba6')

  // Un balanceo muy suave de la mochila, con profundidad: sombra en el suelo y solapa.
  const sway = reduced ? 0 : Math.sin(elapsed / 900) * 0.6
  rect(context, 54 + sway, 98, 120, 6, 'rgba(0,0,0,0.18)')
  rect(context, 48 + sway, 24, 132, 76, '#3b6b8f')
  rect(context, 48 + sway, 24, 132, 6, '#2d5472')
  rect(context, 160 + sway, 30, 20, 70, '#2d5472')
  rect(context, 56 + sway, 46, 100, 46, '#4d82a8')
  rect(context, 48 + sway, 34, 132, 14, '#2d5472')
  rect(context, 48 + sway, 46, 132, 3, '#22425c')
  context.strokeStyle = '#2d5472'
  context.lineWidth = 3
  context.beginPath()
  context.arc(114 + sway, 30, 9, Math.PI, 0)
  context.stroke()

  for (let slot = 0; slot < SLOTS; slot += 1) {
    rect(context, 62 + slot * 16 + sway, 60, 12, 26, '#3b6b8f')
  }

  // Cada objeto cae en su hueco, uno tras otro.
  const items = [
    ...Array.from({ length: view.ropes }, () => 'rope' as const),
    ...Array.from({ length: view.canteens }, () => 'canteen' as const),
  ]
  items.slice(0, SLOTS).forEach((kind, index) => {
    const x = 70 + index * 16 + sway
    const age = reduced ? 1 : ease((elapsed - index * 120) / 420)
    const drop = (1 - age) * -22
    if (kind === 'rope') drawRope(context, x, 66, drop)
    else drawCanteen(context, x, 66, drop)
  })

  // Panel con las cantidades de las variables.
  rect(context, 4, 4, 42, 34, '#1d2f3f')
  label(context, 'cuerdas', 8, 16, 7, '#c8a064')
  label(context, String(view.ropes), 36, 16, 9, '#ffe08a', 'right')
  label(context, 'cant.', 8, 30, 7, '#8ad0ff')
  label(context, String(view.canteens), 36, 30, 9, '#ffe08a', 'right')
}

/** Lienzo de la mochila: los objetos caen en sus huecos según lo que lleva el explorador. */
export function BackpackScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<BackpackView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawBackpack(context, view, now - bornRef.current, reduced)
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
      if (step.kind !== 'backpack') continue
      if (!aliveRef.current) return
      setView({ ropes: step.ropes, canteens: step.canteens, placed: step.placed })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.placed
    ? `La mochila lleva ${view.ropes} cuerdas y ${view.canteens} cantimploras.`
    : 'La mochila está vacía.'

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
