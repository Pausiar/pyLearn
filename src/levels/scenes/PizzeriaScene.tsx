import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { PIZZA_START } from '../../engine/pizzeria'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS, THEMES } from '../../pixel/palette'
import {
  alpha,
  brickWall,
  disc,
  dither,
  glow,
  gradient,
  label,
  panel,
  rand,
  rect,
  ring,
  truncate,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

const THEME = THEMES[4]
const OVEN_X = 112
const OVEN_FLOOR = 104

interface PizzeriaView {
  queue: string[]
  served: string | null
}

const RESTING: PizzeriaView = { queue: [...PIZZA_START], served: null }

function drawSmoke(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  reduced: boolean,
): void {
  for (let index = 0; index < 3; index += 1) {
    const progress = reduced ? (index + 1) / 4 : ((time / 1600 + index / 3) % 1)
    const px = x + Math.round(Math.sin(progress * 5 + index) * 4)
    const py = Math.round(y - progress * 26)
    const size = 2 + Math.round(progress * 4)
    disc(context, px, py, size, alpha(COLORS.paper, 0.2 * (1 - progress)))
  }
}

function drawFlames(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  const sway = reduced ? 0 : Math.round(Math.sin(time / 150) * 1.5)
  const flames = [
    { x: OVEN_X - 9, height: 6, width: 4, colour: COLORS.orange },
    { x: OVEN_X - 4, height: 10, width: 7, colour: COLORS.gold },
    { x: OVEN_X + 3, height: 7, width: 4, colour: COLORS.orange },
  ]

  flames.forEach((flame, index) => {
    const flicker = reduced ? 0 : Math.round(Math.sin(time / 110 + index * 2) * 1.5)
    const height = flame.height + flicker
    const x = flame.x + (index === 1 ? sway : 0)
    rect(context, x, 104 - height, flame.width, height, flame.colour)
    rect(context, x, 104 - height, Math.max(1, flame.width - 2), 3, COLORS.yellow)
  })

  rect(context, OVEN_X - 1 + sway, 99, 2, 3, COLORS.cream)
  rect(context, OVEN_X - 11, 103, 22, 2, COLORS.woodDark)
  rect(context, OVEN_X - 9, 102, 18, 1, COLORS.wood)

  if (!reduced) {
    for (let index = 0; index < 4; index += 1) {
      const phase = (time / 700 + index * 0.23) % 1
      const x = OVEN_X - 7 + Math.round(rand(index + 3) * 14)
      context.globalAlpha = 0.7 * (1 - phase)
      rect(context, x, Math.round(104 - phase * 16), 1, 1, COLORS.gold)
    }
    context.globalAlpha = 1
  }
}

function drawOven(context: CanvasRenderingContext2D): void {
  disc(context, OVEN_X, OVEN_FLOOR, 36, '#43282a')
  disc(context, OVEN_X + 3, OVEN_FLOOR + 2, 34, '#4a2c28')
  disc(context, OVEN_X - 1, OVEN_FLOOR - 2, 33, '#8a4a3e')
  disc(context, OVEN_X - 6, OVEN_FLOOR - 8, 27, '#a85a48')
  for (const radius of [14, 22, 30]) {
    ring(context, OVEN_X, OVEN_FLOOR, radius, alpha('#3a1e1c', 0.6))
  }

  rect(context, OVEN_X - 6, 54, 12, 18, '#6a3a30')
  rect(context, OVEN_X - 6, 54, 12, 1, '#a85a48')
  rect(context, OVEN_X - 8, 51, 16, 3, COLORS.steel)
  rect(context, OVEN_X - 8, 51, 16, 1, COLORS.silver)
}

function drawOvenFront(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  rect(context, OVEN_X - 38, 100, 76, 14, '#5c352c')
  rect(context, OVEN_X - 38, 100, 76, 2, '#a8614e')
  rect(context, OVEN_X - 38, 100, 76, 1, '#c98a5a')
  dither(context, OVEN_X - 36, 103, 72, 9, alpha(COLORS.ink, 0.35), 2)

  disc(context, OVEN_X, 96, 19, '#7a4038')
  rect(context, OVEN_X - 19, 96, 38, 12, '#7a4038')
  disc(context, OVEN_X, 96, 16, '#1a1016')
  rect(context, OVEN_X - 16, 96, 32, 11, '#1a1016')

  glow(
    context,
    OVEN_X,
    104,
    16,
    COLORS.orange,
    reduced ? 0.3 : 0.26 + 0.1 * Math.sin(time / 160),
  )
  rect(context, OVEN_X - 11, 105, 22, 2, '#3a1a10')
  drawFlames(context, time, reduced)
  drawSmoke(context, OVEN_X, 48, time, reduced)
}

function drawTicket(
  context: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
): void {
  rect(context, x, y, 64, 14, '#f2e2c4')
  rect(context, x, y, 64, 2, COLORS.brick)
  rect(context, x, y + 13, 64, 1, '#c9b48f')
  rect(context, x + 18, y - 2, 4, 2, COLORS.silver)
  label(context, truncate(name, 13), x + 4, y + 10, 7, '#241a20')
}

function drawPizzeria(
  context: CanvasRenderingContext2D,
  view: PizzeriaView,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 70, '#241820', '#362430', 8)
  dither(context, 0, 0, 224, 70, alpha(COLORS.ink, 0.2), 3)
  brickWall(context, 0, 70, 224, 34, '#3f2826', '#281a1a')
  dither(context, 0, 70, 224, 34, alpha(COLORS.ink, 0.22), 2)

  rect(context, 63, 0, 2, 9, COLORS.steel)
  rect(context, 59, 9, 10, 2, COLORS.slate)
  rect(context, 61, 11, 6, 1, COLORS.gold)
  glow(
    context,
    64,
    14,
    12,
    COLORS.yellow,
    reduced ? 0.28 : 0.24 + 0.08 * Math.sin(time / 300),
  )
  glow(context, 64, 30, 22, COLORS.gold, 0.05)

  drawOven(context)

  rect(context, 0, 104, 224, 24, '#241a20')
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 15; col += 1) {
      const offset = row % 2 === 0 ? 0 : 8
      rect(context, col * 16 - offset, 105 + row * 12, 15, 11, '#2f2229')
    }
  }
  rect(context, 0, 104, 224, 1, '#4a3a40')
  dither(context, 0, 118, 224, 10, alpha(COLORS.ink, 0.3), 2)
  glow(context, OVEN_X, 112, 24, COLORS.orange, 0.12)

  drawOvenFront(context, time, reduced)

  panel(context, 156, 8, 64, 16, 'rgba(40,16,24,0.86)', '#8a4a4a')
  glow(
    context,
    188,
    16,
    22,
    COLORS.gold,
    reduced ? 0.16 : 0.11 + 0.05 * Math.sin(time / 380),
  )
  label(context, 'PIZZERÍA', 188, 19, 7, COLORS.gold, 'center')

  panel(context, 6, 20, 72, 88, 'rgba(16,12,20,0.8)', '#5a4a48')
  label(context, 'PEDIDOS', 12, 32, 7, COLORS.coral)
  label(context, `${view.queue.length}`, 72, 32, 7, THEME.muted, 'right')
  rect(context, 12, 37, 60, 1, '#7a6a66')

  const tickets = view.queue.slice(0, 4)
  if (tickets.length === 0) {
    label(context, 'sin pedidos', 42, 62, 7, THEME.muted, 'center')
  }
  tickets.forEach((name, index) => {
    drawTicket(context, name, 10, 41 + index * 16)
  })
  if (view.queue.length > 4) {
    label(context, `+${view.queue.length - 4}`, 72, 105, 6, THEME.muted, 'right')
  }

  drawSprite(context, SPRITES.chef, 146, 72, { scale: 2, outline: COLORS.ink })

  rect(context, 170, 90, 52, 3, COLORS.woodLight)
  rect(context, 170, 93, 52, 14, COLORS.woodDark)
  rect(context, 170, 93, 52, 1, COLORS.wood)
  dither(context, 172, 96, 48, 8, alpha(COLORS.ink, 0.3), 2)
  rect(context, 182, 88, 28, 2, '#c9ced8')
  rect(context, 184, 90, 24, 1, '#5a5f6e')

  panel(
    context,
    172,
    42,
    48,
    13,
    'rgba(16,12,20,0.72)',
    view.served === null ? '#4a3a38' : COLORS.green,
  )
  label(
    context,
    'SERVIDA',
    196,
    51,
    7,
    view.served === null ? THEME.muted : COLORS.lime,
    'center',
  )

  if (view.served === null) {
    label(context, '· · ·', 196, 84, 7, '#8a94a8', 'center')
  } else {
    rect(context, 184, 89, 24, 1, alpha(COLORS.ink, 0.4))
    drawSprite(context, SPRITES.pizza, 184, 64, {
      scale: 2,
      outline: COLORS.ink,
      palette: { r: COLORS.coral },
    })
    label(context, truncate(view.served, 9), 196, 103, 6, COLORS.lime, 'center')
    drawSprite(context, SPRITES.check, 212, 46, { scale: 1 })
    drawSprite(context, SPRITES.spark, 178, 58, { scale: 1 })
    for (let index = 0; index < 3; index += 1) {
      const progress = reduced ? (index + 1) / 4 : ((time / 1400 + index / 3) % 1)
      const px = 190 + Math.round(Math.sin(progress * 4 + index * 2) * 4)
      const py = Math.round(60 - progress * 22)
      rect(context, px, py, 1, 2, alpha(COLORS.ice, 0.5 * (1 - progress)))
    }
  }
}

/** Lienzo de la pizzería: la cola de pedidos, el horno y la pizza que sale. */
export function PizzeriaScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<PizzeriaView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawPizzeria(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'pizzeria') continue
      setView({ queue: step.queue, served: step.served })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.served === null
      ? `En el horno de la pizzería esperan ${view.queue.length} pedidos: ${view.queue.join(', ')}.`
      : `Pizza servida: ${view.served}. En la cola quedan: ${view.queue.join(', ')}.`

  return <PixelCanvas label={description} draw={draw} />
}
