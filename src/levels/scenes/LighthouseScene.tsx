import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { LIGHTHOUSE_MESSAGES } from '../../engine/lighthouse'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  cloud,
  disc,
  dither,
  glow,
  gradient,
  label,
  panel,
  rand,
  rect,
  ring,
  speckle,
  starfield,
  truncate,
} from '../../pixel/shapes'

interface LighthouseView {
  lines: string[]
  rescued: boolean
}

const RESTING: LighthouseView = { lines: [], rescued: false }

const LAMP_X = 44
const LAMP_Y = 32

/** Haz de luz: franjas que se ensanchan y pierden opacidad al alejarse del faro. */
function drawBeam(
  context: CanvasRenderingContext2D,
  angle: number,
  length: number,
  colour: string,
  strength: number,
): void {
  for (let step = 4; step < length; step += 2) {
    const spread = 2 + Math.round((step / length) * 9)
    const x = LAMP_X + Math.cos(angle) * step
    const y = LAMP_Y + Math.sin(angle) * step
    context.globalAlpha = strength * (1 - step / length)
    rect(context, x - spread / 2, y - 1, spread, 2, colour)
  }
  context.globalAlpha = 1
}

function drawSky(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 0, 224, 82, '#06101f', '#1b3a5c', 10)
  dither(context, 0, 0, 224, 80, alpha('#7aa7ff', 0.05), 3)
  starfield(context, 0, 0, 224, 62, COLORS.ice, 17, 34, time, reduced)

  glow(context, 98, 14, 13, COLORS.ice, 0.16)
  disc(context, 98, 14, 6, COLORS.ice)
  rect(context, 96, 12, 1, 1, '#a8c8e0')
  rect(context, 99, 16, 2, 1, '#a8c8e0')
  rect(context, 100, 11, 1, 1, '#c9dcef')

  cloud(context, 118, 34, 38, '#223a56', '#162a42')
  cloud(context, 10, 12, 30, '#1c3048', '#142438')
}

function drawSea(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 80, 224, 48, '#153650', '#081522', 6)
  rect(context, 0, 80, 224, 1, '#3f6984')

  for (let index = 0; index < 14; index += 1) {
    const y = 83 + index * 3
    const drift = reduced ? 0 : Math.round(Math.sin(time / 900 + index) * 2)
    rect(context, 97 + drift, y, 4 + Math.floor(index / 3), 1, alpha(COLORS.ice, 0.2 - index * 0.012))
  }

  for (let index = 0; index < 44; index += 1) {
    const y = 86 + Math.floor(rand(index + 3) * 39)
    const drift = reduced ? 0 : Math.sin(time / 800 + index) * 3
    const x = Math.round(rand(index * 7 + 1) * 224 + drift + 224) % 224
    const width = 2 + Math.floor(rand(index * 13 + 5) * 5)
    context.globalAlpha = 0.22 + rand(index * 17 + 9) * 0.4
    rect(context, x, y, width, 1, COLORS.ice)
  }
  context.globalAlpha = 1
}

function drawIsland(context: CanvasRenderingContext2D): void {
  rect(context, 0, 104, 82, 24, '#07101c')
  disc(context, 22, 96, 18, '#0d1a28')
  disc(context, 52, 99, 15, '#0b1622')
  rect(context, 0, 92, 82, 8, '#0b1622')
  speckle(context, 4, 88, 74, 28, '#24384e', 17, 26)
  speckle(context, 6, 96, 68, 18, '#30465e', 39, 14)

  for (let index = 0; index < 10; index += 1) {
    const x = 2 + index * 7
    rect(context, x, 93 + Math.round(Math.sin(index * 1.7) * 2), 4, 1, alpha(COLORS.cream, 0.35))
  }
}

function drawTower(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  // Torre troncocónica con franjas: cada banda gana un poco de anchura.
  for (let band = 0; band < 9; band += 1) {
    const y = 40 + band * 6
    const width = 18 + Math.round(band * 1.1)
    const x = LAMP_X - width / 2
    const striped = band % 3 === 1
    rect(context, x, y, width, 6, striped ? '#c9554d' : '#f2e6cf')
    rect(context, x, y, width, 1, alpha('#ffffff', 0.3))
    rect(context, x + width - 3, y, 3, 6, alpha('#5c3a3c', 0.35))
  }

  // Galería y barandilla.
  rect(context, 29, 38, 30, 3, COLORS.slate)
  rect(context, 29, 38, 30, 1, COLORS.silver)
  for (let index = 0; index <= 6; index += 1) {
    rect(context, 30 + index * 5, 33, 1, 5, COLORS.steel)
  }
  rect(context, 29, 32, 30, 1, COLORS.silver)

  // Linterna y linterna de luz.
  rect(context, 36, 22, 16, 12, '#1a2434')
  rect(context, 37, 23, 14, 10, COLORS.gold)
  rect(context, 37, 23, 14, 2, COLORS.yellow)
  rect(context, 39, 23, 1, 10, '#1a2434')
  rect(context, 44, 23, 1, 10, '#1a2434')
  rect(context, 49, 23, 1, 10, '#1a2434')
  rect(context, 35, 34, 18, 4, COLORS.steel)
  rect(context, 35, 34, 18, 1, COLORS.silver)

  // Tejado escalonado.
  rect(context, 40, 19, 8, 3, '#7d2f26')
  rect(context, 38, 21, 12, 2, '#a8402f')
  rect(context, 42, 17, 4, 2, '#7d2f26')
  rect(context, 43, 15, 2, 2, COLORS.gold)

  // Puerta y ventanas.
  rect(context, 39, 84, 10, 12, '#1c2434')
  rect(context, 40, 86, 8, 10, '#0e1726')
  rect(context, 40, 86, 8, 1, '#3a4a64')
  for (const windowY of [52, 64, 76]) {
    rect(context, 42, windowY, 4, 5, '#14233a')
    rect(context, 42, windowY, 4, 1, '#6a9ac0')
  }

  // Casetilla aneja.
  rect(context, 54, 80, 20, 16, '#d9c8ab')
  rect(context, 54, 80, 20, 2, '#f2e6cf')
  rect(context, 52, 76, 24, 4, '#a8402f')
  rect(context, 54, 76, 20, 1, '#c9554d')
  rect(context, 61, 87, 6, 9, '#2a2018')
  rect(context, 63, 88, 2, 2, COLORS.gold)

  const pulse = reduced ? 0.24 : 0.2 + 0.1 * Math.sin(time / 380)
  glow(context, LAMP_X, LAMP_Y, 13, COLORS.yellow, pulse)
  glow(context, LAMP_X, LAMP_Y, 28, COLORS.gold, 0.06)

  if (!reduced) {
    const phase = (time % 2600) / 2600
    context.globalAlpha = 0.22 * (1 - phase)
    ring(context, LAMP_X, LAMP_Y, Math.round(12 + phase * 22), COLORS.gold)
    context.globalAlpha = 1
  }
}

function drawBoat(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  const bob = reduced ? 0 : Math.round(Math.sin(time / 420) * 1)
  const bx = 148
  const by = 82 + bob

  glow(context, bx + 26, by - 6, 16, COLORS.gold, 0.16)
  for (let index = 0; index < 4; index += 1) {
    rect(context, bx - 10 - index * 4, by + 12 + index, 5, 1, alpha(COLORS.ice, 0.35 - index * 0.07))
    rect(context, bx + 48 + index * 4, by + 13 + index, 5, 1, alpha(COLORS.ice, 0.28 - index * 0.06))
  }

  // Casco escalonado.
  rect(context, bx + 4, by + 4, 40, 4, '#e8dcc4')
  rect(context, bx + 2, by + 8, 44, 3, '#c9554d')
  rect(context, bx + 6, by + 11, 36, 3, '#8f362c')
  rect(context, bx + 12, by + 14, 24, 2, '#5c241e')
  rect(context, bx + 2, by + 8, 44, 1, '#f2a08f')

  // Cabina y mástil.
  rect(context, bx + 10, by - 6, 18, 10, '#f2e6cf')
  rect(context, bx + 12, by - 4, 5, 5, COLORS.gold)
  rect(context, bx + 20, by - 4, 5, 5, COLORS.gold)
  rect(context, bx + 9, by - 8, 20, 2, '#a8402f')
  rect(context, bx + 34, by - 18, 1, 22, COLORS.steel)
  rect(context, bx + 35, by - 18, 6, 4, COLORS.coral)
  rect(context, bx + 35, by - 14, 4, 2, COLORS.coral)

  const blink = reduced ? 1 : 0.6 + 0.4 * Math.sin(time / 240)
  context.globalAlpha = blink
  rect(context, bx + 34, by - 20, 2, 2, COLORS.yellow)
  context.globalAlpha = 1

  rect(context, bx + 16, by + 6, 5, 2, COLORS.silver)
  rect(context, bx + 17, by + 5, 3, 1, COLORS.paper)
  label(context, 'RESCATE', bx + 24, by + 24, 5, COLORS.lime, 'center')
}

function drawMessages(
  context: CanvasRenderingContext2D,
  view: LighthouseView,
): void {
  const complete = view.rescued

  panel(context, 112, 6, 106, 52, 'rgba(6,14,28,0.88)', complete ? COLORS.green : '#38507a')
  glow(context, 116, 14, 10, complete ? COLORS.lime : COLORS.cyan, 0.08)
  label(context, 'MENSAJES AL MAR', 122, 17, 6, COLORS.ice)
  rect(context, 122, 21, 90, 1, alpha(COLORS.ice, 0.3))
  label(context, `${view.lines.length}/3`, 212, 17, 6, complete ? COLORS.lime : COLORS.yellow, 'right')

  LIGHTHOUSE_MESSAGES.forEach((expected, index) => {
    const y = 30 + index * 11
    const sent = index < view.lines.length
    const line = view.lines[index] ?? ''
    const matches = sent && line === expected
    const dot = sent ? (matches ? COLORS.lime : COLORS.coral) : '#2a3a52'

    rect(context, 123, y - 4, 4, 4, dot)
    if (sent) {
      label(context, '»', 130, y, 7, alpha(COLORS.ice, 0.55))
      label(context, truncate(line, 16), 138, y, 6, matches ? COLORS.paper : COLORS.coral)
      if (matches) rect(context, 208, y - 4, 3, 1, COLORS.lime)
    } else {
      label(context, '· · ·', 138, y, 6, '#5f739a')
    }
  })
}

/** Lienzo del faro: haz giratorio, mar nocturno y el registro de mensajes. */
export function LighthouseScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<LighthouseView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawSky(context, time, reduced)
      const sweep = reduced ? 0.18 : 0.18 + Math.sin(time / 2400) * 0.5
      drawBeam(context, sweep, 190, COLORS.yellow, 0.19)
      drawBeam(context, sweep + Math.PI, 110, COLORS.gold, 0.05)
      drawSea(context, time, reduced)
      drawIsland(context)
      drawTower(context, time, reduced)
      if (view.rescued) drawBoat(context, time, reduced)
      drawMessages(context, view)

      panel(context, 6, 6, 82, 15, 'rgba(6,14,28,0.82)', '#38507a')
      label(context, 'FARO PYLEARN', 12, 16, 7, COLORS.cream)
      rect(context, 78, 10, 4, 4, view.lines.length === 3 ? COLORS.lime : COLORS.gold)

      panel(context, 6, 110, 212, 15, 'rgba(6,14,28,0.9)', '#38507a')
      const status = view.rescued
        ? '¡RESCATE EN CAMINO! Los tres mensajes han llegado.'
        : view.lines.length === 0
          ? 'El faro espera tu primer mensaje.'
          : `${view.lines.length} de 3 mensajes enviados. La lámpara sigue llamando.`
      label(context, status, 12, 120, 6, view.rescued ? COLORS.lime : COLORS.ice)
      const lampColour = view.lines.length === 0 ? '#40547a' : view.rescued ? COLORS.lime : COLORS.gold
      disc(context, 207, 117, 3, lampColour)
      if (view.lines.length > 0) glow(context, 207, 117, 7, lampColour, 0.2)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'lighthouse') continue
      setView({ lines: step.lines, rescued: step.rescued })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 520)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.rescued
    ? 'El faro ha enviado los tres mensajes y el barco de rescate se acerca.'
    : `El faro ha enviado ${view.lines.length} de ${LIGHTHOUSE_MESSAGES.length} mensajes: ${view.lines.join(', ') || 'ninguno'}.`

  return <PixelCanvas label={description} draw={draw} />
}
