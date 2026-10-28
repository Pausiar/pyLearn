import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { ROCKET_FUEL, ROCKET_PER_TANK, ROCKET_TANKS } from '../../engine/rocket'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  cloud,
  disc,
  dither,
  glow,
  gradient,
  label,
  line,
  panel,
  rect,
  speckle,
  starfield,
} from '../../pixel/shapes'

interface RocketView {
  fuel: number
  sent: boolean
}

const RESTING: RocketView = { fuel: 0, sent: false }
const ROCKET_X = 176
const PAD_Y = 94

function drawSky(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 0, 224, 94, '#060a1a', '#251d46', 9)
  dither(context, 0, 0, 224, 84, alpha(COLORS.violet, 0.05), 3)
  starfield(context, 0, 0, 224, 74, COLORS.ice, 11, 34, time, reduced)
  cloud(context, 6, 48, 42, '#1b2140', '#131830')
  cloud(context, 138, 24, 50, '#1d2342', '#141930')
}

function drawPad(context: CanvasRenderingContext2D): void {
  rect(context, 0, PAD_Y, 224, 34, '#1a2238')
  rect(context, 0, PAD_Y, 224, 2, '#34446a')
  rect(context, 0, PAD_Y + 2, 224, 1, '#0e1424')
  speckle(context, 0, PAD_Y + 3, 224, 30, alpha(COLORS.silver, 0.12), 31, 40)

  // Baldosas de peligro en el borde del pad.
  for (let index = 0; index < 16; index += 1) {
    rect(context, index * 15, 104, 8, 3, alpha(COLORS.gold, 0.35))
  }
  for (let index = 0; index < 4; index += 1) {
    rect(context, 10 + index * 58, 116, 22, 3, '#2c3a5c')
    rect(context, 18 + index * 58, 119, 6, 2, '#2c3a5c')
  }
}

function drawGantry(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  const x = 126
  rect(context, x, 32, 3, 62, '#2c3a5c')
  rect(context, x + 12, 32, 3, 62, '#2c3a5c')
  rect(context, x, 32, 15, 2, '#4a5a80')
  for (let y = 38; y < 92; y += 10) {
    line(context, x + 2, y, x + 13, y + 9, '#243352')
    line(context, x + 13, y, x + 2, y + 9, '#243352')
  }
  rect(context, x - 3, 90, 22, 4, '#2c3a5c')
  rect(context, x + 2, 54, 22, 2, COLORS.steel)
  rect(context, x + 20, 50, 4, 8, COLORS.steel)
  rect(context, x - 6, 46, 5, 3, '#3a4a6a')

  const blink = reduced ? 1 : 0.45 + 0.55 * Math.abs(Math.sin(time / 260))
  context.globalAlpha = blink
  disc(context, x + 1, 29, 2, COLORS.red)
  glow(context, x + 1, 29, 7, COLORS.red, 0.2 * blink)
  context.globalAlpha = 1

  const panelOn = reduced ? 0.7 : 0.5 + 0.5 * Math.sin(time / 600)
  context.globalAlpha = 0.25 + panelOn * 0.35
  rect(context, x + 17, 56, 6, 4, COLORS.cyan)
  context.globalAlpha = 1
}

function drawRocket(
  context: CanvasRenderingContext2D,
  view: RocketView,
  time: number,
  reduced: boolean,
): void {
  const cx = ROCKET_X
  const base = PAD_Y - 2
  const confirmed = view.sent && view.fuel === ROCKET_FUEL

  // Aletas laterales.
  for (const side of [-1, 1] as const) {
    const x = side < 0 ? cx - 18 : cx + 10
    rect(context, x, base - 20, 8, 8, COLORS.red)
    rect(context, side < 0 ? x - 2 : x + 2, base - 14, 6, 8, COLORS.brickDark)
    rect(context, side < 0 ? x - 2 : x + 1, base - 7, 7, 5, COLORS.red)
  }

  // Cuerpo, sombra y brillo.
  rect(context, cx - 10, base - 56, 20, 56, '#e8ecf5')
  rect(context, cx - 10, base - 56, 5, 56, '#c3cadd')
  rect(context, cx + 6, base - 56, 4, 56, '#d3d9e6')
  rect(context, cx - 10, base - 56, 1, 56, '#ffffff')
  rect(context, cx - 10, base - 30, 20, 3, COLORS.red)
  rect(context, cx - 10, base - 27, 20, 1, '#a8402f')
  rect(context, cx - 10, base - 46, 20, 1, alpha(COLORS.steel, 0.5))

  // Ojiva escalonada.
  rect(context, cx - 6, base - 68, 12, 4, '#f6f8fc')
  rect(context, cx - 8, base - 64, 16, 4, '#f6f8fc')
  rect(context, cx - 2, base - 74, 4, 6, COLORS.red)
  rect(context, cx - 6, base - 70, 12, 2, COLORS.coral)
  rect(context, cx - 8, base - 66, 16, 2, COLORS.coral)

  // Ventanilla y escotilla.
  disc(context, cx, base - 42, 4, '#1b2440')
  disc(context, cx, base - 42, 3, COLORS.cyan)
  rect(context, cx - 1, base - 45, 1, 2, alpha('#ffffff', 0.7))
  rect(context, cx + 9, base - 38, 1, 7, alpha(COLORS.steel, 0.6))

  // Tobera.
  rect(context, cx - 6, base, 12, 3, COLORS.slate)
  rect(context, cx - 5, base + 1, 10, 2, '#0e1424')
  label(context, 'PY', cx, base - 20, 5, COLORS.steel, 'center')

  if (confirmed) {
    const flick = reduced ? 0 : Math.sin(time / 70)
    glow(context, cx, base + 8, 20, COLORS.orange, 0.24)
    rect(context, cx - 5, base + 3, 10, 9 + Math.max(0, flick * 2), COLORS.coral)
    rect(context, cx - 3, base + 3, 6, 13 + Math.max(0, flick * 3), COLORS.gold)
    rect(context, cx - 1, base + 4, 2, 8, COLORS.cream)
    for (let index = 0; index < 5; index += 1) {
      const drift = reduced ? 0 : Math.round(Math.sin(time / 500 + index) * 4)
      disc(context, cx - 22 - index * 7 + drift, base + 6 + index, 4 + index, alpha('#c9d3e6', 0.22 - index * 0.03))
    }
  }
}

function drawTanks(context: CanvasRenderingContext2D, view: RocketView): void {
  const perTank = view.sent ? view.fuel : 0
  const exact = view.sent && view.fuel === ROCKET_FUEL
  const colour = exact ? COLORS.lime : view.fuel > ROCKET_FUEL ? COLORS.coral : COLORS.gold

  label(context, 'DEPÓSITOS', 10, 70, 4, '#7f8db8')
  for (let index = 0; index < ROCKET_TANKS; index += 1) {
    const x = 10 + index * 12
    const amount = Math.max(0, Math.min(1, perTank / ROCKET_PER_TANK - index))
    bevel(context, x, 74, 9, 18, '#1d2638', '#3a4560', '#0e1424')
    rect(context, x + 1, 76, 7, 14, '#0b0f1c')
    const fill = Math.round(amount * 14)
    if (fill > 0) {
      rect(context, x + 1, 90 - fill, 7, fill, colour)
      rect(context, x + 1, 90 - fill, 7, 1, alpha('#ffffff', 0.45))
    }
    rect(context, x - 1, 72, 11, 2, '#3a4560')
    rect(context, x + 3, 70, 3, 2, COLORS.steel)
  }

  rect(context, 8, 92, 118, 2, '#34446a')
  rect(context, 8, 92, 118, 1, '#4a5a80')
  rect(context, 118, 88, 4, 8, '#34446a')
}

function drawBoard(context: CanvasRenderingContext2D, view: RocketView): void {
  const exact = view.sent && view.fuel === ROCKET_FUEL
  const border = exact ? COLORS.green : view.sent ? COLORS.coral : '#3a4a7a'

  panel(context, 6, 6, 104, 54, 'rgba(8,14,30,0.9)', border)
  if (exact) glow(context, 58, 33, 46, COLORS.lime, 0.06)

  label(context, 'TORRE DE CONTROL', 12, 16, 6, COLORS.ice)
  const blink = exact ? COLORS.lime : view.sent ? COLORS.coral : COLORS.gold
  disc(context, 102, 13, 2, blink)
  rect(context, 12, 20, 92, 1, alpha(COLORS.ice, 0.25))

  label(context, 'CÁLCULO', 12, 28, 4, '#7f8db8')
  rect(context, 12, 31, 92, 12, '#0b1020')
  label(context, `${ROCKET_TANKS} × ${ROCKET_PER_TANK} − 15`, 58, 40, 7, COLORS.cream, 'center')

  label(context, 'RECIBIDO', 12, 50, 4, '#7f8db8')
  const readout = view.sent ? `${view.fuel} t` : '—'
  label(context, readout, 102, 58, 9, exact ? COLORS.lime : view.sent ? COLORS.coral : '#56648a', 'right')
}

/** Lienzo del cohete: el depósito se llena con la cifra de la torre y despega si es la exacta. */
export function RocketScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<RocketView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const exact = view.sent && view.fuel === ROCKET_FUEL

      drawSky(context, time, reduced)
      drawPad(context)
      drawGantry(context, time, reduced)
      drawRocket(context, view, time, reduced)
      drawTanks(context, view)
      drawBoard(context, view)

      if (exact) {
        for (let index = 0; index < 4; index += 1) {
          const x = 140 + index * 6
          const y = 70 + Math.sin(time / 300 + index) * 2
          rect(context, x, y, 1, 1, COLORS.cream)
          rect(context, x + 1, y + 1, 1, 1, COLORS.gold)
        }
      }

      panel(context, 6, 110, 212, 15, 'rgba(8,14,30,0.92)', '#3a4a7a')
      const status = exact
        ? '¡CIFRA EXACTA! Despegue autorizado.'
        : view.sent
          ? `La torre recibió ${view.fuel} t y no autoriza el despegue.`
          : 'La torre espera el cálculo del combustible.'
      label(context, status, 12, 120, 6, exact ? COLORS.lime : view.sent ? COLORS.coral : COLORS.ice)
      disc(context, 207, 117, 3, exact ? COLORS.lime : view.sent ? COLORS.coral : '#40547a')
      if (exact) glow(context, 207, 117, 7, COLORS.lime, 0.2)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'rocket') continue
      setView({ fuel: step.fuel, sent: step.sent })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 520)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.sent
    ? `La torre ha recibido ${view.fuel} toneladas de combustible.`
    : 'La torre de control espera el cálculo del combustible.'

  return <PixelCanvas label={description} draw={draw} />
}
