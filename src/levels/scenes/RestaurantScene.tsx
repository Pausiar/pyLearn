import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { SERVICE } from '../../engine/restaurant'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  disc,
  dither,
  gradient,
  label,
  line,
  panel,
  rand,
  rect,
  speckle,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface RestaurantView {
  trace: { action: string; ingrediente: string }[]
  served: string[]
  done: boolean
}

const RESTING: RestaurantView = { trace: [], served: [], done: false }

const PLATE_X = [178, 196, 214]
const PLATE_TOP = 74

function drawSteam(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  reduced: boolean,
  colour = alpha(COLORS.paper, 0.5),
): void {
  for (let index = 0; index < 3; index += 1) {
    const drift = reduced ? 0 : Math.sin(time / 380 + index * 1.7) * 2
    const rise = reduced ? index * 3 : (time / 140 + index * 4) % 11
    context.globalAlpha = 0.55 - rise / 26
    rect(context, Math.round(x + drift + index * 2), Math.round(y - rise), 1, 2, colour)
  }
  context.globalAlpha = 1
}

/** Plato servido: una sopa con vapor o una tarta con su guinda. */
function drawDish(
  context: CanvasRenderingContext2D,
  cx: number,
  plato: string | null,
  time: number,
  reduced: boolean,
): void {
  rect(context, cx - 8, PLATE_TOP + 8, 16, 2, '#7f8aa3')
  rect(context, cx - 10, PLATE_TOP + 6, 20, 2, COLORS.silver)
  rect(context, cx - 6, PLATE_TOP + 10, 12, 1, '#5c6678')

  if (plato === null) {
    rect(context, cx - 5, PLATE_TOP + 3, 10, 1, alpha(COLORS.paper, 0.12))
    return
  }

  if (plato === 'sopa') {
    rect(context, cx - 7, PLATE_TOP + 1, 14, 5, '#e6dfcc')
    rect(context, cx - 6, PLATE_TOP, 12, 1, COLORS.cream)
    rect(context, cx - 5, PLATE_TOP + 1, 10, 2, '#d98a3a')
    rect(context, cx - 4, PLATE_TOP + 1, 3, 1, '#ffc06a')
    rect(context, cx - 7, PLATE_TOP + 1, 1, 4, COLORS.paper)
    rect(context, cx + 6, PLATE_TOP + 1, 1, 4, COLORS.paper)
    rect(context, cx - 5, PLATE_TOP + 6, 10, 1, '#b9b19c')
    drawSteam(context, cx - 3, PLATE_TOP - 1, time, reduced)
    return
  }

  for (let row = 0; row < 4; row += 1) {
    const width = 12 - row * 2
    rect(context, cx - width / 2, PLATE_TOP + 1 + row * 2, width, 2, '#c98d4a')
    rect(context, cx - width / 2, PLATE_TOP + 2 + row * 2, width, 1, '#e8b46a')
  }
  rect(context, cx - 6, PLATE_TOP + 8, 12, 1, COLORS.woodDark)
  rect(context, cx - 3, PLATE_TOP, 6, 1, COLORS.cream)
  disc(context, cx + 1, PLATE_TOP - 1, 1, COLORS.red)
  rect(context, cx + 1, PLATE_TOP - 3, 1, 1, COLORS.deepGreen)
}

/** La comanda colgada del raíl: qué toca servir y qué ya ha salido. */
function drawTicket(
  context: CanvasRenderingContext2D,
  view: RestaurantView,
  time: number,
  reduced: boolean,
): void {
  rect(context, 12, 10, 58, 54, alpha(COLORS.ink, 0.35))
  rect(context, 10, 8, 58, 54, '#efe2c4')
  rect(context, 10, 8, 58, 1, '#fff4dc')
  rect(context, 10, 8, 58, 13, COLORS.brick)
  rect(context, 10, 8, 58, 1, '#d06a4a')
  label(context, 'COMANDA', 39, 18, 7, COLORS.cream, 'center')
  rect(context, 16, 6, 4, 2, COLORS.silver)
  rect(context, 58, 6, 4, 2, COLORS.silver)

  SERVICE.forEach((order, index) => {
    const y = 26 + index * 10
    const done = index < view.served.length
    const current = index === view.served.length && !view.done
    if (current) {
      rect(context, 13, y, 52, 9, alpha(COLORS.gold, reduced ? 0.3 : 0.22 + 0.16 * Math.sin(time / 300)))
    }
    label(context, `${index + 1} ${order.plato.toUpperCase()}`, 15, y + 7, 6, done ? '#7a6a52' : '#241a20')
    if (done) {
      drawSprite(context, SPRITES.check, 56, y + 1, { scale: 1, palette: { g: COLORS.forest } })
    } else {
      rect(context, 59, y + 3, 4, 4, '#d8c8a8')
      rect(context, 60, y + 4, 2, 2, '#b7a888')
    }
  })

  rect(context, 10, 56, 58, 1, '#c9b896')
  label(context, `PASO ${Math.min(view.trace.length, 9)}/9`, 15, 60, 5, '#6a5a48')
  label(context, view.done ? 'LISTO' : '', 63, 60, 5, COLORS.forest, 'right')
}

function drawHangingPans(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  line(context, 76, 11, 142, 11, COLORS.silver)
  const pans = [
    { x: 84, radius: 5, colour: '#4a5568' },
    { x: 102, radius: 6, colour: '#8a5a2b' },
    { x: 121, radius: 4, colour: '#7d2f26' },
  ]

  pans.forEach((pan, index) => {
    const sway = reduced ? 0 : Math.round(Math.sin(time / 900 + index) * 1)
    line(context, pan.x, 11, pan.x + sway, 17, COLORS.silver)
    disc(context, pan.x + sway, 17 + pan.radius, pan.radius, pan.colour)
    line(context, pan.x + sway - pan.radius, 17 + pan.radius, pan.x + sway + pan.radius, 17 + pan.radius, '#2a3147')
  })
}

function drawWindow(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  bevel(context, 150, 8, 66, 38, '#3b2b33', '#5a4048', '#231a22', COLORS.ink)
  context.save()
  context.beginPath()
  context.rect(153, 11, 60, 32)
  context.clip()

  gradient(context, 153, 11, 60, 32, '#5a3a6a', '#e8a060', 6)
  disc(context, 192, 34, 6, '#ffd48a')
  disc(context, 192, 34, 4, '#ffe8b8')
  for (let index = 0; index < 3; index += 1) {
    const drift = reduced ? index * 16 : (time / 60 + index * 20) % 80
    line(
      context,
      153 + ((drift + index * 23) % 60),
      20 + index * 4,
      160 + ((drift + index * 23) % 60),
      20 + index * 4,
      alpha('#5a3a4a', 0.6),
    )
  }
  rect(context, 153, 38, 60, 5, '#3a2a30')
  context.restore()

  rect(context, 181, 8, 2, 38, '#231a22')
  rect(context, 150, 26, 66, 2, '#231a22')
  rect(context, 154, 12, 2, 20, alpha(COLORS.paper, 0.14))
  rect(context, 156, 12, 1, 12, alpha(COLORS.paper, 0.1))

  rect(context, 148, 44, 70, 3, '#4f2c16')
  rect(context, 162, 40, 8, 4, '#a8553a')
  disc(context, 166, 38, 2, COLORS.moss)
  rect(context, 165, 34, 1, 4, COLORS.forest)
  rect(context, 167, 35, 3, 1, COLORS.forest)
}

function drawRange(
  context: CanvasRenderingContext2D,
  view: RestaurantView,
  time: number,
  reduced: boolean,
): void {
  bevel(context, 106, 48, 60, 40, '#3e4459', '#5f6a86', '#242a3a', COLORS.ink)

  rect(context, 108, 47, 56, 4, '#1b202c')
  for (let index = 0; index < 4; index += 1) {
    line(context, 108 + index * 14, 47, 108 + index * 14, 51, '#0e1118')
  }

  const flame = reduced ? 1 : 0.7 + 0.3 * Math.sin(time / 90)
  context.globalAlpha = flame
  rect(context, 128, 44, 3, 2, COLORS.orange)
  rect(context, 133, 43, 3, 3, COLORS.gold)
  rect(context, 138, 44, 3, 2, COLORS.orange)
  rect(context, 136, 44, 1, 1, COLORS.yellow)
  context.globalAlpha = 1

  rect(context, 122, 30, 26, 14, '#8a94a8')
  rect(context, 123, 31, 24, 1, '#c9d2e2')
  rect(context, 122, 30, 3, 14, '#b6c0d4')
  rect(context, 142, 30, 6, 3, '#6b7590')
  rect(context, 122, 43, 26, 1, '#5c6678')
  rect(context, 125, 31, 20, 2, '#d99a4a')
  rect(context, 127, 31, 6, 1, '#ffc06a')
  rect(context, 120, 32, 2, 3, '#5c6678')
  rect(context, 148, 32, 2, 3, '#5c6678')
  drawSteam(context, 128, 27, time, reduced, alpha(COLORS.cream, 0.55))

  for (let index = 0; index < 4; index += 1) {
    disc(context, 113 + index * 7, 54, 2, index === 1 ? COLORS.gold : '#2a3147')
    rect(context, 112 + index * 7, 53, 1, 1, alpha(COLORS.paper, 0.2))
  }

  rect(context, 111, 58, 50, 26, '#232a3a')
  rect(context, 111, 58, 50, 1, '#4a5568')
  rect(context, 114, 61, 44, 17, '#12161f')
  const baked = view.trace.some((entry) => entry.action === 'hornear')
  gradient(context, 115, 62, 42, 15, baked ? '#5a3420' : '#1a202c', baked ? '#c9783a' : '#0a0e16', 5)
  if (baked) {
    dither(context, 115, 62, 42, 15, alpha(COLORS.gold, 0.18), 3)
    const pulse = reduced ? 0.5 : 0.35 + 0.2 * Math.sin(time / 260)
    context.globalAlpha = pulse
    rect(context, 130, 67, 12, 4, alpha(COLORS.gold, 0.5))
    context.globalAlpha = 1
  }
  rect(context, 114, 64, 44, 1, alpha(COLORS.ink, 0.5))
  rect(context, 114, 61, 44, 1, '#0a0e16')
  rect(context, 112, 80, 48, 2, '#161a24')
  line(context, 116, 58, 116, 84, alpha(COLORS.paper, 0.06))
}

function drawPrep(
  context: CanvasRenderingContext2D,
  view: RestaurantView,
  time: number,
  reduced: boolean,
): void {
  bevel(context, 10, 80, 38, 9, '#b07a3f', '#d09a5c', '#7d5028')
  rect(context, 13, 80, 32, 1, '#c98d4a')
  rect(context, 13, 86, 32, 1, '#8a5a2b')

  const last = view.trace[view.trace.length - 1]
  if (last?.action === 'picar') {
    speckle(context, 15, 78, 28, 6, alpha(COLORS.cream, 0.8), 7, 8)
  }

  disc(context, 20, 76, 4, '#e9d8b0')
  rect(context, 20, 72, 1, 8, '#c9b488')
  rect(context, 17, 76, 7, 1, '#c9b488')
  rect(context, 18, 74, 1, 1, '#c9b488')
  rect(context, 18, 78, 1, 1, '#c9b488')

  disc(context, 35, 76, 4, '#c94a3a')
  rect(context, 35, 72, 1, 4, COLORS.woodDark)
  rect(context, 36, 72, 2, 1, COLORS.forest)
  rect(context, 34, 74, 1, 1, alpha(COLORS.paper, 0.4))

  line(context, 44, 80, 54, 76, '#c9d2e2')
  line(context, 44, 81, 54, 77, '#6b7590')
  line(context, 54, 76, 58, 75, COLORS.woodDark)
  line(context, 54, 77, 58, 76, COLORS.wood)

  if (last?.action === 'servir' && !reduced) {
    context.globalAlpha = 0.4 + 0.3 * Math.sin(time / 220)
    line(context, 46, 70, 52, 66, COLORS.gold)
    line(context, 48, 72, 54, 68, COLORS.gold)
    context.globalAlpha = 1
  }
}

function drawPass(
  context: CanvasRenderingContext2D,
  view: RestaurantView,
  time: number,
  reduced: boolean,
): void {
  rect(context, 166, 84, 56, 4, '#8a5a2b')
  rect(context, 166, 84, 56, 1, '#b07a3f')
  rect(context, 166, 87, 56, 1, '#5c3a1c')
  rect(context, 170, 88, 3, 5, '#5c3a1c')
  rect(context, 215, 88, 3, 5, '#5c3a1c')

  PLATE_X.forEach((x, index) => {
    const plato = view.served[index] ?? null
    drawDish(context, x, plato, time + index * 90, reduced)
  })

  if (view.done) {
    const pulse = reduced ? 1 : 0.75 + 0.25 * Math.sin(time / 300)
    context.globalAlpha = pulse
    panel(context, 170, 48, 50, 12, 'rgba(47,107,58,0.92)', COLORS.lime)
    drawSprite(context, SPRITES.check, 173, 50, { scale: 1, palette: { g: COLORS.lime } })
    label(context, 'LISTO', 197, 56, 6, COLORS.cream, 'center')
    context.globalAlpha = 1
    for (let index = 0; index < 8; index += 1) {
      const progress = reduced ? 0.6 : (time / 1400 + index / 8) % 1
      context.globalAlpha = 0.7 * (1 - progress)
      rect(
        context,
        Math.round(170 + rand(index + 21) * 52),
        Math.round(48 - progress * 16),
        1,
        1,
        COLORS.gold,
      )
    }
    context.globalAlpha = 1
  }
}

function drawKitchen(
  context: CanvasRenderingContext2D,
  view: RestaurantView,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 96, '#3c2a33', '#231a24', 8)
  for (let y = 20; y < 96; y += 14) {
    rect(context, 0, y, 224, 1, alpha(COLORS.paper, 0.035))
  }
  for (let x = 0; x < 224; x += 22) {
    rect(context, x, 0, 1, 96, alpha(COLORS.ink, 0.12))
  }
  dither(context, 0, 0, 224, 96, alpha(COLORS.ink, 0.1), 3)

  drawWindow(context, time, reduced)
  drawTicket(context, view, time, reduced)
  drawHangingPans(context, time, reduced)
  drawRange(context, view, time, reduced)
  drawPrep(context, view, time, reduced)

  rect(context, 0, 88, 224, 4, '#a86a3a')
  rect(context, 0, 88, 224, 1, '#c98d4a')
  rect(context, 0, 91, 224, 1, '#7d5028')
  rect(context, 0, 92, 224, 12, '#5c3a1c')
  for (let x = 4; x < 224; x += 18) {
    rect(context, x, 95, 1, 7, alpha(COLORS.ink, 0.25))
  }
  rect(context, 0, 92, 224, 1, '#3f2512')

  drawPass(context, view, time, reduced)

  drawSprite(context, SPRITES.chef, 76, 50, { scale: 2 })
  rect(context, 76, 82, 24, 2, alpha(COLORS.ink, 0.35))

  rect(context, 0, 104, 224, 24, '#2a2028')
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 28; column += 1) {
      if ((row + column) % 2 === 0) continue
      rect(context, column * 8, 106 + row * 10, 8, 10, '#332630')
    }
  }
  rect(context, 0, 104, 224, 1, '#4a3640')
  speckle(context, 2, 108, 220, 18, alpha(COLORS.ink, 0.3), 13, 20)

  rect(context, 8, 108, 22, 14, '#4a3a2a')
  rect(context, 8, 108, 22, 2, '#6a5540')
  rect(context, 11, 112, 16, 8, '#3a2c20')
  rect(context, 14, 116, 10, 2, alpha(COLORS.gold, 0.25))
  rect(context, 196, 110, 20, 12, '#5c3a1c')
  rect(context, 196, 110, 20, 2, '#8a5a2b')
  rect(context, 199, 114, 14, 1, alpha(COLORS.gold, 0.2))

  if (!reduced) {
    for (let index = 0; index < 10; index += 1) {
      const progress = (time / 5200 + rand(index + 5)) % 1
      const x = 8 + rand(index + 31) * 208
      const y = 10 + progress * 82
      context.globalAlpha = 0.22 * (1 - progress)
      rect(context, Math.round(x), Math.round(y), 1, 1, COLORS.cream)
    }
    context.globalAlpha = 1
  }
}

/** Lienzo de la cocina: la comanda, los fogones y los platos que salen al pase. */
export function RestaurantScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<RestaurantView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawKitchen(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'restaurant') continue
      setView({ trace: step.trace, served: step.served, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 300)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.trace.length === 0
      ? 'La cocina espera la comanda: una sopa, una tarta y otra sopa.'
      : `La cocina lleva ${view.trace.length} pasos y ha servido ${view.served.length} de 3 platos${
          view.served.length === 0 ? '' : `: ${view.served.join(', ')}`
        }.${view.done ? ' El servicio está completo.' : ''}`

  return <PixelCanvas label={description} draw={draw} />
}
