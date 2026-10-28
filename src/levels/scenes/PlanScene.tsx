import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { PLAN_LINES } from '../../engine/plan'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  cloud,
  disc,
  glow,
  gradient,
  groundTexture,
  hills,
  label,
  line,
  mix,
  rand,
  rect,
  speckle,
  starfield,
  truncate,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface PlanView {
  lines: string[]
  done: boolean
}

const RESTING: PlanView = { lines: [], done: false }

const SUN_X = 108

function drawSky(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
  progress: number,
  complete: boolean,
): void {
  const warmth = progress / 3
  gradient(
    context,
    0,
    0,
    224,
    68,
    mix('#1c2440', '#8fd3ff', warmth),
    mix('#403a58', '#ffe2b0', warmth),
    12,
  )

  if (progress < 2) {
    starfield(
      context,
      0,
      0,
      224,
      56,
      alpha(COLORS.ice, Math.max(0.12, 0.8 - progress * 0.25)),
      23,
      26 - progress * 6,
      time,
      reduced,
    )
  }

  cloud(context, 8, 18, 36, mix('#3a3550', '#f2c4a0', warmth), mix('#2c2842', '#c98a70', warmth))
  cloud(context, 82, 8, 30, mix('#3a3550', '#f2c4a0', warmth), mix('#2c2842', '#c98a70', warmth))

  // El sol asoma entre el establo y el tablón, oculto todavía por el horizonte.
  const sunY = 70 - progress * 14
  glow(context, SUN_X, sunY, 18 + progress * 5, COLORS.gold, 0.1 + progress * 0.03)
  disc(context, SUN_X, sunY, 8, COLORS.gold)
  disc(context, SUN_X - 1, sunY - 1, 6, COLORS.yellow)

  if (complete) {
    for (let index = 0; index < 8; index += 1) {
      const angle = (index / 8) * Math.PI * 2 + (reduced ? 0 : time / 5200)
      line(
        context,
        SUN_X + Math.cos(angle) * 12,
        sunY + Math.sin(angle) * 12,
        SUN_X + Math.cos(angle) * 18,
        sunY + Math.sin(angle) * 18,
        alpha(COLORS.gold, 0.5),
      )
    }
  }
}

function drawBarn(context: CanvasRenderingContext2D): void {
  rect(context, 0, 84, 100, 8, '#28301c')

  // Tejado a dos aguas.
  rect(context, 12, 24, 72, 4, '#7d2f26')
  rect(context, 8, 28, 80, 4, '#8f362c')
  rect(context, 4, 32, 88, 5, '#a8402f')
  rect(context, 1, 37, 94, 7, '#7d2f26')
  rect(context, 1, 37, 94, 1, '#c9554d')

  // Cuerpo, esquinas y puerta.
  bevel(context, 6, 44, 84, 42, '#a8402f', '#c9554d', '#7d2f26', COLORS.ink)
  rect(context, 6, 44, 84, 2, '#f2e6cf')
  rect(context, 36, 58, 26, 28, '#f2e6cf')
  rect(context, 38, 60, 22, 26, '#2a1810')
  line(context, 38, 60, 60, 86, '#8a5a3a')
  line(context, 60, 60, 38, 86, '#8a5a3a')
  rect(context, 39, 73, 20, 1, '#d9b878')

  rect(context, 42, 50, 16, 10, '#2a1810')
  rect(context, 43, 51, 14, 8, '#0e0a12')
  rect(context, 45, 52, 1, 6, '#6a5a3a')
  rect(context, 54, 52, 1, 6, '#6a5a3a')

  for (const wx of [12, 70]) {
    rect(context, wx, 56, 9, 9, '#f2e6cf')
    rect(context, wx + 1, 57, 7, 7, '#f2c46a')
    rect(context, wx + 4, 57, 1, 7, '#8a5a2a')
    rect(context, wx + 1, 60, 7, 1, '#8a5a2a')
  }

  rect(context, 48, 22, 1, 3, COLORS.steel)
  rect(context, 44, 20, 9, 1, COLORS.steel)
  rect(context, 52, 18, 2, 2, COLORS.coral)
}

function drawFence(context: CanvasRenderingContext2D): void {
  rect(context, 0, 92, 118, 2, COLORS.wood)
  rect(context, 0, 99, 118, 2, COLORS.woodDark)
  for (let x = 2; x < 116; x += 20) {
    rect(context, x, 86, 3, 18, COLORS.wood)
    rect(context, x, 86, 3, 1, COLORS.woodLight)
    rect(context, x, 92, 3, 1, alpha(COLORS.ink, 0.3))
  }
}

function drawSprout(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
): void {
  rect(context, x, y - height, 1, height, '#2f6b3a')
  rect(context, x - 2, y - height + 2, 2, 1, COLORS.moss)
  rect(context, x + 1, y - height + 4, 2, 1, COLORS.green)
  rect(context, x - 1, y - height + 1, 1, 1, COLORS.lime)
}

function drawFields(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  for (let index = 0; index < 12; index += 1) {
    const x = 8 + index * 9
    const baseY = 112 + (index % 2) * 9
    const sway = reduced ? 0 : Math.round(Math.sin(time / 1400 + index) * 1)
    drawSprout(context, x + sway, baseY, 7 + (index % 3))
  }
  for (let index = 0; index < 9; index += 1) {
    const x = 124 + index * 10
    const baseY = 110 + (index % 2) * 10
    const sway = reduced ? 0 : Math.round(Math.sin(time / 1500 + index * 2) * 1)
    drawSprout(context, x + sway, baseY, 6 + (index % 3))
  }

  // Gallina picoteando junto al establo.
  const peck = reduced ? 0 : Math.round(Math.abs(Math.sin(time / 700)) * 1)
  rect(context, 92, 108, 7, 5, '#f2e6cf')
  rect(context, 98, 104, 4, 4, '#f2e6cf')
  rect(context, 98, 102, 2, 2, COLORS.coral)
  rect(context, 101, 106 - peck, 2, 1, COLORS.gold)
  rect(context, 93, 113, 1, 3, COLORS.gold)
  rect(context, 97, 113, 1, 3, COLORS.gold)
  rect(context, 91, 107, 1, 2, '#d9cec0')
}

function drawBoard(
  context: CanvasRenderingContext2D,
  view: PlanView,
  complete: boolean,
): void {
  bevel(context, 118, 10, 98, 94, '#5c3a1c', '#8a5a2b', '#3e2712', COLORS.ink)
  rect(context, 122, 14, 90, 86, '#f2e2c4')
  rect(context, 122, 99, 90, 1, '#c9b48f')
  disc(context, 126, 17, 2, COLORS.coral)
  disc(context, 208, 17, 2, COLORS.coral)

  label(context, 'PLAN DE HOY', 165, 27, 6, '#3a2a18', 'center')
  rect(context, 126, 31, 82, 1, '#c9b48f')

  for (let index = 0; index < PLAN_LINES.length; index += 1) {
    const y = 47 + index * 17
    disc(context, 132, y - 3, 5, '#e2cfa8')
    label(context, String(index + 1), 132, y, 5, '#5a4a38', 'center')

    const actual = view.lines[index]
    if (actual === undefined) {
      for (let x = 141; x < 201; x += 4) rect(context, x, y, 1, 1, '#c4b08c')
      label(context, '· · ·', 141, y, 5, '#b9a583')
      continue
    }

    const matches = actual === PLAN_LINES[index]
    label(context, truncate(actual, 17), 141, y, 6, '#2a2018')
    if (matches) {
      drawSprite(context, SPRITES.check, 203, y - 7, { scale: 1, palette: { g: COLORS.forest } })
    } else {
      drawSprite(context, SPRITES.cross, 203, y - 7, { scale: 1 })
    }
  }

  rect(context, 126, 88, 82, 1, '#c9b48f')
  label(context, `${view.lines.length}/${PLAN_LINES.length} líneas`, 126, 98, 5, '#5a4a38')
  if (complete) {
    label(context, '¡HECHO!', 208, 98, 6, COLORS.forest, 'right')
  } else {
    disc(context, 204, 95, 3, COLORS.gold)
    rect(context, 203, 95, 3, 1, COLORS.yellow)
  }
}

/** Lienzo de la granja: el sol sube con cada línea del plan escrito en el tablón. */
export function PlanScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<PlanView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const progress = view.lines.length
      const complete = view.done

      drawSky(context, time, reduced, progress, complete)
      hills(context, 66, 16, mix('#3a3550', '#7ccf75', progress / 4), 5)
      hills(context, 68, 9, mix('#33384a', '#4caf50', progress / 5), 13)
      groundTexture(
        context,
        0,
        64,
        224,
        64,
        mix('#3f4a2a', '#5a5a2e', progress / 4),
        mix('#5c6b38', '#9a8a4c', progress / 4),
        '#26321a',
        5,
      )
      speckle(context, 0, 64, 224, 64, alpha('#d9b878', 0.18), 61, 24)

      drawBarn(context)
      drawFence(context)
      drawFields(context, time, reduced)

      if (complete) glow(context, 167, 57, 66, COLORS.gold, 0.08)
      drawBoard(context, view, complete)

      if (complete) {
        for (const [x, y] of [[88, 16], [96, 22], [104, 14]] as const) {
          rect(context, x, y, 1, 1, COLORS.steel)
          rect(context, x + 1, y + 1, 1, 1, COLORS.steel)
          rect(context, x + 2, y, 1, 1, COLORS.steel)
        }
      }

      for (let index = 0; index < 5; index += 1) {
        const x = 6 + Math.round(rand(index + 8) * 106)
        rect(context, x, 110 + Math.round(rand(index + 21) * 12), 2, 1, alpha(COLORS.moss, 0.5))
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'plan') continue
      setView({ lines: step.lines, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 520)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.lines.length === 0
      ? 'El plan de la jornada está en blanco y el sol aún no ha salido.'
      : `El sol ha subido con ${view.lines.length} de ${PLAN_LINES.length} líneas del plan: ${view.lines.join(' · ')}.`

  return <PixelCanvas label={description} draw={draw} />
}
