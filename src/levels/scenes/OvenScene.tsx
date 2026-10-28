import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { ORDERS } from '../../engine/oven'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  brickWall,
  disc,
  dither,
  glow,
  gradient,
  label,
  mix,
  panel,
  rand,
  rect,
  ring,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

const PIZZA_PALETTES: Record<string, Record<string, string>> = {
  margarita: { r: COLORS.green, y: COLORS.gold, n: COLORS.woodLight },
  barbacoa: { r: COLORS.brick, y: '#e0a83a', n: COLORS.woodDark },
  anchoas: { r: COLORS.silver, y: COLORS.sand, n: COLORS.woodDark },
}

interface OvenView {
  baked: { sabor: string; cantidad: number }[]
  done: boolean
}

const RESTING: OvenView = { baked: [], done: false }

function bakedCount(view: OvenView, sabor: string): number {
  return view.baked
    .filter((order) => order.sabor === sabor)
    .reduce((total, order) => total + order.cantidad, 0)
}

function drawSmoke(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  reduced: boolean,
): void {
  for (let index = 0; index < 3; index += 1) {
    const progress = reduced ? (index + 1) / 4 : ((time / 1500 + index / 3) % 1)
    const px = x + Math.round(Math.sin(progress * 5 + index) * 4)
    const py = Math.round(y - progress * 24)
    disc(context, px, py, 2 + Math.round(progress * 3), alpha(COLORS.paper, 0.2 * (1 - progress)))
  }
}

function drawOven(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  rect(context, 150, 40, 72, 5, '#a8614e')
  rect(context, 150, 40, 72, 1, '#c98a5a')
  brickWall(context, 154, 44, 64, 60, '#8a4a3e', '#5c352c')
  dither(context, 154, 44, 64, 60, alpha(COLORS.ink, 0.2), 2)

  rect(context, 190, 20, 12, 22, '#6a3a30')
  rect(context, 190, 20, 12, 1, '#a85a48')
  rect(context, 188, 18, 16, 3, COLORS.steel)
  rect(context, 188, 18, 16, 1, COLORS.silver)
  drawSmoke(context, 196, 14, time, reduced)

  disc(context, 184, 80, 20, '#7a4038')
  rect(context, 164, 80, 40, 20, '#7a4038')
  ring(context, 184, 80, 20, '#c98a5a')
  disc(context, 184, 80, 17, '#1a1016')
  rect(context, 167, 80, 34, 18, '#1a1016')
  glow(
    context,
    184,
    92,
    18,
    COLORS.orange,
    reduced ? 0.3 : 0.26 + 0.1 * Math.sin(time / 150),
  )
  rect(context, 172, 95, 24, 2, COLORS.woodDark)
  rect(context, 174, 94, 20, 1, COLORS.wood)
  const sway = reduced ? 0 : Math.round(Math.sin(time / 130) * 1.5)
  const flames = [
    { x: 176, height: 6, width: 4, colour: COLORS.orange },
    { x: 181, height: 10, width: 6, colour: COLORS.gold },
    { x: 188, height: 6, width: 4, colour: COLORS.orange },
  ]
  flames.forEach((flame, index) => {
    const flicker = reduced ? 0 : Math.round(Math.sin(time / 100 + index * 2) * 1.5)
    rect(
      context,
      flame.x + (index === 1 ? sway : 0),
      94 - flame.height - flicker,
      flame.width,
      flame.height + flicker,
      flame.colour,
    )
  })
  rect(context, 183 + sway, 84, 2, 4, COLORS.cream)

  rect(context, 202, 58, 10, 42, COLORS.steel)
  rect(context, 202, 58, 10, 1, COLORS.silver)
  rect(context, 203, 60, 8, 38, '#6a7280')
  rect(context, 204, 78, 2, 4, COLORS.ink)
  rect(context, 204, 78, 2, 1, COLORS.paper)
}

function drawKitchen(context: CanvasRenderingContext2D): void {
  rect(context, 104, 26, 44, 1, COLORS.silver)
  for (const x of [112, 126, 140]) rect(context, x, 26, 1, 3, COLORS.steel)

  disc(context, 114, 35, 4, COLORS.ink)
  disc(context, 114, 34, 3, COLORS.slate)
  rect(context, 117, 33, 7, 1, COLORS.steel)
  disc(context, 130, 35, 3, COLORS.silver)
  rect(context, 132, 34, 5, 1, COLORS.steel)
  rect(context, 138, 29, 8, 12, COLORS.paper)
  rect(context, 138, 30, 8, 1, COLORS.brick)
  rect(context, 138, 36, 8, 1, alpha(COLORS.brick, 0.6))

  rect(context, 104, 52, 44, 2, COLORS.woodLight)
  rect(context, 104, 54, 44, 2, COLORS.woodDark)
  rect(context, 108, 42, 8, 10, '#6aa6a0')
  rect(context, 108, 42, 8, 1, COLORS.ice)
  rect(context, 110, 45, 2, 4, alpha(COLORS.paper, 0.4))
  rect(context, 120, 44, 7, 8, '#c96a4a')
  rect(context, 120, 44, 7, 1, COLORS.cream)
  rect(context, 130, 41, 9, 11, '#8a5aa8')
  rect(context, 130, 41, 9, 1, COLORS.violet)
  rect(context, 132, 45, 2, 4, alpha(COLORS.paper, 0.35))
}

function drawTicket(
  context: CanvasRenderingContext2D,
  view: OvenView,
  totalPizzas: number,
): void {
  rect(context, 7, 9, 94, 78, alpha(COLORS.ink, 0.35))
  rect(context, 6, 8, 94, 78, '#f4e6c8')
  rect(context, 6, 8, 94, 12, COLORS.brick)
  rect(context, 6, 8, 94, 1, mix('#ffffff', COLORS.brick, 0.2))
  label(context, 'TICKET DEL DÍA', 53, 17, 6, COLORS.cream, 'center')
  rect(context, 14, 6, 4, 3, COLORS.silver)
  rect(context, 82, 6, 4, 3, COLORS.silver)

  ORDERS.forEach((order, index) => {
    const y = 33 + index * 16
    const done = bakedCount(view, order.sabor)
    const complete = done >= order.cantidad
    rect(context, 12, y - 7, 8, 8, complete ? COLORS.green : '#f4e6c8')
    rect(context, 12, y - 7, 8, 1, complete ? COLORS.lime : '#8a7a5c')
    rect(context, 12, y, 8, 1, complete ? COLORS.forest : '#8a7a5c')
    rect(context, 12, y - 7, 1, 8, complete ? COLORS.lime : '#8a7a5c')
    rect(context, 19, y - 7, 1, 8, complete ? COLORS.forest : '#8a7a5c')
    if (complete) {
      drawSprite(context, SPRITES.check, 12, y - 7, {
        scale: 1,
        palette: { g: COLORS.lime },
      })
    }
    label(context, `${order.cantidad} ${order.sabor}`, 24, y, 7, '#241a20')
    label(
      context,
      `${done}/${order.cantidad}`,
      94,
      y,
      6,
      complete ? COLORS.forest : '#6a5a48',
      'right',
    )
  })

  label(context, `Horneadas: ${totalPizzas}/6`, 12, 82, 6, view.done ? COLORS.forest : '#5c4a38')
}

function drawOvenScene(
  context: CanvasRenderingContext2D,
  view: OvenView,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 62, '#2a1e26', '#3a2a30', 8)
  dither(context, 0, 0, 224, 62, alpha(COLORS.ink, 0.18), 3)
  brickWall(context, 0, 58, 224, 46, '#3f2826', '#281a1a')
  dither(context, 0, 58, 224, 46, alpha(COLORS.ink, 0.22), 2)

  rect(context, 0, 104, 224, 24, '#5c3a1c')
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 15; col += 1) {
      const offset = row % 2 === 0 ? 0 : 8
      rect(context, col * 16 - offset, 105 + row * 12, 15, 11, row === 0 ? '#6b4423' : '#4a2f18')
    }
  }
  rect(context, 0, 104, 224, 1, '#8a5f2e')
  dither(context, 0, 116, 224, 12, alpha(COLORS.ink, 0.3), 2)

  drawOven(context, time, reduced)
  drawKitchen(context)
  drawSprite(context, SPRITES.chef, 128, 72, { scale: 2, outline: COLORS.ink })

  const pizzas = view.baked.flatMap((order) =>
    Array.from({ length: order.cantidad }, () => order.sabor),
  )

  rect(context, 6, 98, 112, 4, '#2a1c12')
  rect(context, 6, 102, 112, 18, '#8a5a2b')
  rect(context, 6, 102, 112, 4, '#b07a3f')
  rect(context, 6, 106, 112, 1, '#6b4423')
  rect(context, 6, 118, 112, 2, '#5c3a1c')
  rect(context, 116, 102, 2, 18, '#5c3a1c')
  for (let x = 14; x < 118; x += 26) rect(context, x, 109, 12, 1, alpha(COLORS.ink, 0.25))

  pizzas.slice(0, 6).forEach((sabor, index) => {
    drawSprite(context, SPRITES.pizza, 8 + index * 18, 90, {
      outline: COLORS.ink,
      palette: PIZZA_PALETTES[sabor] ?? {},
    })
    if (index === pizzas.length - 1 && !reduced) {
      const progress = (time / 1200) % 1
      rect(context, 13 + index * 18, Math.round(88 - progress * 8), 1, 2, alpha(COLORS.ice, 0.5))
    }
  })
  rect(context, 8, 106, 10, 9, COLORS.paper)
  rect(context, 8, 106, 10, 1, COLORS.silver)
  rect(context, 8, 110, 10, 1, COLORS.brick)

  drawTicket(context, view, pizzas.length)

  if (view.done) {
    panel(context, 150, 108, 68, 14, 'rgba(47,107,58,0.92)', COLORS.green)
    drawSprite(context, SPRITES.check, 154, 111, {
      scale: 1,
      palette: { g: COLORS.lime },
    })
    label(context, 'TANDA COMPLETA', 184, 118, 6, COLORS.lime, 'center')
    for (let index = 0; index < 8; index += 1) {
      const progress = reduced ? 0.5 : ((time / 1400 + index / 8) % 1)
      const px = Math.round(14 + rand(index + 17) * 130)
      context.globalAlpha = 0.8 * (1 - progress * 0.5)
      rect(context, px, Math.round(88 - progress * 24), 1, 2, index % 2 === 0 ? COLORS.gold : COLORS.lime)
    }
    context.globalAlpha = 1
  }
}

/** Lienzo del horno: el ticket del día boca abajo y las pizzas saliendo. */
export function OvenScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<OvenView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawOvenScene(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'oven') continue
      setView({ baked: step.baked, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 360)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const counts = ORDERS.map((order) => `${bakedCount(view, order.sabor)} de ${order.sabor}`).join(', ')
  const description = view.done
    ? `Tanda completa: ${counts}.`
    : `El horno lleva ${counts}.`

  return <PixelCanvas label={description} draw={draw} />
}
