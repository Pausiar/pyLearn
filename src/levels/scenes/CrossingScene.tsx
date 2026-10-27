import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface CrossingView {
  redCrossed: boolean
  redWaited: boolean
  greenCrossed: boolean
  greenWaited: boolean
}

const RESTING: CrossingView = { redCrossed: false, redWaited: false, greenCrossed: false, greenWaited: false }
const WINDOWS = Array.from({ length: 24 }, (_, index) => ({
  x: 6 + (index % 8) * 12,
  y: 14 + Math.floor(index / 8) * 10,
  on: index % 3 !== 0,
  phase: index * 0.9,
}))

function outcome(crossed: boolean, waited: boolean): string {
  if (crossed) return 'cruzó'
  return waited ? 'esperó' : 'no hizo nada'
}

function drawCity(context: CanvasRenderingContext2D, elapsed: number, reduced: boolean): void {
  const blocks: [number, number, number][] = [
    [0, 40, 30],
    [28, 30, 44],
    [56, 46, 36],
    [100, 34, 52],
    [132, 52, 40],
    [182, 38, 48],
  ]
  blocks.forEach(([x, width, height], index) => rect(context, x, 88 - height, width, height, index % 2 ? '#1c2440' : '#222c4c'))
  WINDOWS.forEach((win) => {
    const on = win.on && (reduced || Math.sin(elapsed / 800 + win.phase) > -0.6)
    rect(context, win.x, win.y, 4, 4, on ? '#ffd86a' : '#2b3558')
  })
}

function drawRoad(context: CanvasRenderingContext2D): void {
  rect(context, 0, 92, WIDTH, 36, '#3a4152')
  rect(context, 0, 92, WIDTH, 2, '#50586d')
  polygon(context, [[0, 92], [WIDTH, 92], [WIDTH, 98], [0, 98]], '#2a2f3d')
  polygon(context, [[0, 98], [WIDTH, 98], [WIDTH, 128], [0, 128]], '#262a36')
  for (let index = 0; index < 6; index += 1) {
    const x = 10 + index * 36
    polygon(context, [[x, 120], [x + 14, 120], [x + 10, 110], [x + 4, 110]], '#e8e2c4')
  }
  for (let x = 88; x < 136; x += 8) rect(context, x, 100, 4, 14, '#e8ecf5')
}

function polygon(context: CanvasRenderingContext2D, points: [number, number][], colour: string): void {
  context.fillStyle = colour
  context.beginPath()
  context.moveTo(points[0][0], points[0][1])
  points.slice(1).forEach(([x, y]) => context.lineTo(x, y))
  context.closePath()
  context.fill()
}

function drawLight(context: CanvasRenderingContext2D, green: boolean): void {
  polygon(context, [[60, 30], [70, 30], [72, 92], [58, 92]], 'rgba(0,0,0,0.25)')
  rect(context, 56, 30, 16, 62, '#0a0f1c')
  rect(context, 58, 32, 12, 26, '#1d2638')
  rect(context, 58, 32, 12, 2, '#2c3648')
  rect(context, 60, 36, 8, 8, !green ? '#ff5a6a' : '#4a2a33')
  rect(context, 60, 46, 8, 8, '#4a4a2a')
  rect(context, 60, 56, 8, 8, green ? '#4ce07a' : '#1d3a2a')
  rect(context, 61, 57, 3, 2, green ? '#d0ffe0' : '#1d3a2a')
  rect(context, 62, 92, 2, 14, '#3a4152')
}

function drawWalker(context: CanvasRenderingContext2D, elapsed: number, walking: boolean, reduced: boolean): void {
  const progress = walking && !reduced ? Math.min(elapsed / 1400, 1) : walking ? 1 : 0
  const x = 40 + progress * 140
  const stride = walking && !reduced ? Math.sin(elapsed / 150) : 0
  const bob = walking && !reduced ? Math.abs(stride) * 1.5 : 0
  context.fillStyle = 'rgba(0,0,0,0.25)'
  context.beginPath()
  context.ellipse(x, 124, 6, 2, 0, 0, Math.PI * 2)
  context.fill()
  rect(context, x - 4, 110 - bob, 3, 12 + stride * 2, '#2a2f3d')
  rect(context, x + 1, 110 - bob, 3, 12 - stride * 2, '#2a2f3d')
  rect(context, x - 5, 98 - bob, 10, 14, '#3b6b8f')
  rect(context, x + 3, 98 - bob, 2, 14, '#2d5472')
  rect(context, x - 6, 100 - bob, 2, 10, '#3b6b8f')
  rect(context, x + 4, 100 - bob, 2, 10, '#3b6b8f')
  rect(context, x - 4, 88 - bob, 8, 10, '#e8c39e')
  rect(context, x - 4, 86 - bob, 8, 3, '#5a3e2b')
}

function drawCar(context: CanvasRenderingContext2D, elapsed: number): void {
  const x = ((elapsed / 9) % (WIDTH + 70)) - 40
  context.fillStyle = 'rgba(0,0,0,0.3)'
  context.beginPath()
  context.ellipse(x + 20, 116, 22, 3, 0, 0, Math.PI * 2)
  context.fill()
  rect(context, x, 98, 40, 12, '#c4505e')
  rect(context, x + 2, 94, 22, 6, '#c4505e')
  rect(context, x + 6, 94, 14, 5, '#8ad0ff')
  rect(context, x + 4, 110, 6, 5, '#1a1a22')
  rect(context, x + 30, 110, 6, 5, '#1a1a22')
  rect(context, x + 37, 101, 3, 2, '#ffe08a')
}

function drawCrossing(context: CanvasRenderingContext2D, view: CrossingView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  const green = view.greenCrossed || view.greenWaited
  rect(context, 0, 0, WIDTH, 92, '#0e1730')
  drawCity(context, elapsed, reduced)
  drawRoad(context)
  drawLight(context, green)
  drawWalker(context, elapsed, view.greenCrossed, reduced)
  if (view.redWaited && !view.greenCrossed && !reduced) drawCar(context, elapsed)

  rect(context, 4, 4, 112, 22, 'rgba(10,18,38,0.85)')
  label(context, `Luz roja: ${outcome(view.redCrossed, view.redWaited)}`, 8, 14, 8, '#e8f1ff')
  label(context, `Luz verde: ${outcome(view.greenCrossed, view.greenWaited)}`, 8, 24, 8, '#e8f1ff')
}

/** Lienzo del semáforo: qué hizo el peatón con cada luz. */
export function CrossingScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<CrossingView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawCrossing(context, view, now - bornRef.current, reduced)
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
      if (step.kind !== 'crossing') continue
      if (!aliveRef.current) return
      setView({
        redCrossed: step.redCrossed,
        redWaited: step.redWaited,
        greenCrossed: step.greenCrossed,
        greenWaited: step.greenWaited,
      })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 480)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = `Con la luz roja el peatón ${outcome(view.redCrossed, view.redWaited)}. Con la luz verde ${outcome(view.greenCrossed, view.greenWaited)}.`

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
