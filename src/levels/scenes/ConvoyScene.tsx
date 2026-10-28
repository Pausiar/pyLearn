import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { TRAIN_FULL } from '../../engine/convoy'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS, THEMES } from '../../pixel/palette'
import {
  alpha,
  cloud,
  disc,
  glow,
  gradient,
  groundTexture,
  hills,
  label,
  mix,
  panel,
  rand,
  rect,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

const THEME = THEMES[4]
const WAGON_W = 21
const WAGON_GAP = 24
const WAGON_Y = 70

interface ConvoyView {
  full: string[]
  convoy: string[]
  formed: boolean
}

const RESTING: ConvoyView = { full: [...TRAIN_FULL], convoy: [], formed: false }

interface LoadStyle {
  body: string
  roof: string
}

const LOAD_STYLES: Record<string, LoadStyle> = {
  carbón: { body: '#3a3f4a', roof: '#262a32' },
  madera: { body: '#8a5a2b', roof: '#5c3a1c' },
  agua: { body: '#2b6cb0', roof: '#1b2a4a' },
  ganado: { body: '#7a5a3a', roof: '#4a3520' },
  correo: { body: '#b04a3a', roof: '#7d2f26' },
  fruta: { body: '#4caf50', roof: '#2f6b3a' },
  cemento: { body: '#6b7280', roof: '#4a5568' },
  furgón: { body: '#4a5568', roof: '#2a3147' },
}

const wagonX = (index: number): number => 3 + index * WAGON_GAP

function drawCargo(
  context: CanvasRenderingContext2D,
  load: string,
  cx: number,
  cy: number,
): void {
  switch (load) {
    case 'carbón':
      disc(context, cx - 4, cy + 2, 3, '#14161c')
      disc(context, cx + 1, cy, 3, '#14161c')
      disc(context, cx + 5, cy + 3, 2, '#14161c')
      rect(context, cx - 4, cy, 1, 1, '#3a3f4a')
      break
    case 'madera':
      for (let index = 0; index < 3; index += 1) {
        rect(context, cx - 6, cy - 3 + index * 3, 12, 2, COLORS.woodLight)
        rect(context, cx - 6, cy - 3 + index * 3, 12, 1, COLORS.wood)
        rect(context, cx - 6, cy - 3 + index * 3, 2, 2, COLORS.sand)
      }
      break
    case 'agua':
      rect(context, cx - 6, cy - 5, 12, 10, COLORS.waterDeep)
      rect(context, cx - 6, cy - 5, 12, 1, COLORS.water)
      rect(context, cx - 5, cy - 4, 10, 3, alpha(COLORS.ice, 0.45))
      rect(context, cx - 6, cy + 3, 12, 2, COLORS.navy)
      break
    case 'ganado':
      rect(context, cx - 6, cy - 1, 11, 5, COLORS.cream)
      rect(context, cx - 4, cy, 2, 2, COLORS.ink)
      rect(context, cx + 1, cy - 1, 2, 2, COLORS.ink)
      rect(context, cx + 5, cy - 4, 3, 4, COLORS.cream)
      rect(context, cx + 7, cy - 3, 1, 1, COLORS.ink)
      rect(context, cx - 5, cy + 4, 1, 2, COLORS.woodDark)
      rect(context, cx + 3, cy + 4, 1, 2, COLORS.woodDark)
      break
    case 'correo':
      rect(context, cx - 6, cy - 3, 12, 7, COLORS.paper)
      rect(context, cx - 6, cy - 3, 12, 1, COLORS.silver)
      rect(context, cx - 1, cy - 1, 2, 1, COLORS.brick)
      rect(context, cx - 6, cy + 3, 12, 1, COLORS.stone)
      break
    case 'fruta':
      disc(context, cx - 4, cy + 1, 2, COLORS.coral)
      disc(context, cx + 1, cy - 1, 2, COLORS.red)
      disc(context, cx + 4, cy + 2, 2, COLORS.coral)
      rect(context, cx + 1, cy - 4, 1, 2, COLORS.lime)
      break
    case 'cemento':
      rect(context, cx - 6, cy - 3, 5, 8, COLORS.silver)
      rect(context, cx + 1, cy - 2, 6, 7, COLORS.stone)
      rect(context, cx - 5, cy - 3, 3, 1, COLORS.ice)
      rect(context, cx + 2, cy - 2, 4, 1, COLORS.ice)
      break
    case 'furgón':
      rect(context, cx - 4, cy - 5, 8, 10, COLORS.slate)
      rect(context, cx - 3, cy - 4, 6, 3, COLORS.gold)
      rect(context, cx - 3, cy - 4, 6, 1, COLORS.cream)
      rect(context, cx + 1, cy + 1, 2, 1, COLORS.silver)
      break
    default:
      rect(context, cx - 4, cy - 4, 8, 8, COLORS.steel)
  }
}

function drawSteam(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number,
  reduced: boolean,
): void {
  for (let index = 0; index < 3; index += 1) {
    const progress = reduced ? (index + 1) / 4 : ((time / 1500 + index / 3) % 1)
    const px = x - Math.round(progress * 10 + Math.sin(progress * 4 + index) * 2)
    const py = Math.round(y - progress * 22)
    disc(context, px, py, 2 + Math.round(progress * 3), alpha(COLORS.paper, 0.26 * (1 - progress)))
  }
}

function drawLocomotive(
  context: CanvasRenderingContext2D,
  x: number,
  time: number,
  reduced: boolean,
): void {
  rect(context, x, 78, 16, 16, '#2f4a56')
  rect(context, x, 78, 16, 2, '#5a8a9a')
  rect(context, x, 92, 16, 2, '#1e3038')
  rect(context, x, 88, 16, 1, COLORS.gold)

  rect(context, x + 12, 64, 9, 30, '#2f4a56')
  rect(context, x + 11, 62, 11, 3, '#1e3038')
  rect(context, x + 14, 67, 5, 6, '#0e1730')
  rect(context, x + 14, 67, 5, 1, COLORS.gold)
  rect(context, x + 14, 70, 5, 3, alpha(COLORS.gold, 0.35))

  rect(context, x + 3, 64, 5, 14, '#1e3038')
  rect(context, x + 2, 62, 7, 2, COLORS.steel)
  rect(context, x + 2, 62, 7, 1, COLORS.silver)

  rect(context, x + 18, 80, 2, 3, COLORS.gold)
  rect(context, x + 19, 81, 1, 1, COLORS.cream)

  for (const offset of [4, 10, 16]) {
    disc(context, x + offset, 96, 3, COLORS.ink)
    disc(context, x + offset, 96, 1, COLORS.silver)
  }

  drawSteam(context, x + 5, 61, time, reduced)
}

function drawWagon(
  context: CanvasRenderingContext2D,
  load: string,
  index: number,
  highlighted: boolean,
  dimmed: boolean,
): void {
  const x = wagonX(index)
  const style = LOAD_STYLES[load] ?? { body: COLORS.steel, roof: COLORS.slate }

  if (highlighted) glow(context, x + WAGON_W / 2, WAGON_Y + 12, 16, COLORS.green, 0.16)

  rect(context, x - 1, WAGON_Y - 1, WAGON_W + 2, 1, COLORS.ink)
  rect(context, x - 1, WAGON_Y + 24, WAGON_W + 2, 1, COLORS.ink)
  rect(context, x - 1, WAGON_Y, 1, 24, COLORS.ink)
  rect(context, x + WAGON_W, WAGON_Y, 1, 24, COLORS.ink)

  rect(context, x, WAGON_Y, WAGON_W, 24, style.body)
  rect(context, x, WAGON_Y, WAGON_W, 3, style.roof)
  rect(context, x, WAGON_Y + 3, WAGON_W, 1, mix(style.body, '#ffffff', 0.3))
  rect(context, x, WAGON_Y + 22, WAGON_W, 2, mix(style.body, '#000000', 0.35))
  for (let rib = 0; rib < 3; rib += 1) {
    rect(context, x + 4 + rib * 6, WAGON_Y + 4, 1, 17, alpha(COLORS.ink, 0.22))
  }

  drawCargo(context, load, x + WAGON_W / 2, WAGON_Y + 13)

  disc(context, x + 6, 96, 3, COLORS.ink)
  disc(context, x + 15, 96, 3, COLORS.ink)
  disc(context, x + 6, 96, 1, COLORS.silver)
  disc(context, x + 15, 96, 1, COLORS.silver)
  rect(context, x + WAGON_W, 88, 3, 1, COLORS.steel)

  if (highlighted) {
    rect(context, x - 1, WAGON_Y - 1, WAGON_W + 2, 1, COLORS.lime)
    rect(context, x - 1, WAGON_Y + 24, WAGON_W + 2, 1, COLORS.lime)
    rect(context, x - 1, WAGON_Y, 1, 24, COLORS.lime)
    rect(context, x + WAGON_W, WAGON_Y, 1, 24, COLORS.lime)
  }

  if (dimmed) {
    context.fillStyle = alpha(COLORS.ink, load === 'furgón' ? 0.45 : 0.26)
    context.fillRect(x - 1, WAGON_Y - 1, WAGON_W + 2, 32)
  }
  if (dimmed && load === 'furgón') {
    drawSprite(context, SPRITES.cross, x + 7, 79, { scale: 1 })
  }
}

/** Lienzo del tren largo: los nueve vagones y el convoy recortado. */
export function ConvoyScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<ConvoyView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const loads = view.full.length > 0 ? view.full : TRAIN_FULL
      const inConvoy = (index: number): boolean =>
        view.formed && index >= 1 && index <= 4 && index < loads.length

      gradient(context, 0, 0, 224, 100, THEME.skyTop, THEME.skyBottom, 10)
      starfield(context, 0, 0, 224, 46, COLORS.ice, 33, 18, time, reduced)
      glow(context, 204, 16, 14, COLORS.cream, 0.25)
      disc(context, 204, 16, 6, COLORS.cream)
      disc(context, 201, 14, 3, COLORS.yellow)
      cloud(context, 18, 22, 26, '#5a4a78', '#463a62')
      cloud(context, 118, 12, 20, '#5a4a78', '#463a62')
      hills(context, 86, 16, THEME.silhouette, 13)
      hills(context, 92, 10, '#2b2438', 29, 3)

      groundTexture(context, 0, 103, 224, 25, '#2b2438', '#443a54', '#1a1626', 41)
      for (let x = 0; x < 224; x += 8) rect(context, x, 100, 5, 3, '#3a3148')
      rect(context, 0, 99, 224, 1, COLORS.silver)
      rect(context, 0, 100, 224, 1, '#6a5c80')
      rect(context, 0, 101, 224, 2, '#241e30')

      loads.forEach((load, index) => {
        if (index === 0 && load === 'locomotora') {
          drawLocomotive(context, wagonX(index), time, reduced)
          return
        }
        drawWagon(context, load, index, inConvoy(index), view.formed && !inConvoy(index))
      })

      const from = wagonX(1) + WAGON_W / 2
      const to = wagonX(4) + WAGON_W / 2
      const bracketColour = view.formed ? COLORS.lime : alpha(COLORS.cream, 0.75)
      rect(context, from, 56, to - from, 1, bracketColour)
      rect(context, from, 56, 1, 5, bracketColour)
      rect(context, to, 56, 1, 5, bracketColour)
      label(
        context,
        'tren[1:5]',
        Math.round((from + to) / 2),
        52,
        7,
        view.formed ? COLORS.lime : COLORS.cream,
        'center',
      )
      if (view.formed) glow(context, (from + to) / 2, 56, 24, COLORS.green, 0.1)

      panel(
        context,
        6,
        6,
        132,
        34,
        'rgba(20,16,36,0.86)',
        view.formed ? COLORS.green : '#5a4a78',
      )
      label(
        context,
        view.formed ? 'CONVOY EN MARCHA' : 'TREN LARGO',
        12,
        17,
        8,
        view.formed ? COLORS.lime : COLORS.paper,
      )
      label(
        context,
        view.formed
          ? `${view.convoy.length} vagones acoplados`
          : `${loads.length} vagones · del 0 al 8`,
        12,
        27,
        6,
        THEME.muted,
      )
      label(
        context,
        view.formed ? 'el furgón se queda en tierra' : 'recorta con tren[1:5]',
        12,
        36,
        6,
        THEME.muted,
      )

      if (view.formed) {
        const hasFurgon = view.convoy.includes('furgón')
        const hasCemento = loads.includes('cemento')
        panel(context, 146, 6, 72, 34, 'rgba(20,16,36,0.86)', '#2f6b3a')
        label(context, 'COMPROBADO', 182, 16, 7, COLORS.lime, 'center')
        drawSprite(context, hasFurgon ? SPRITES.cross : SPRITES.check, 150, 19, {
          scale: 1,
        })
        drawSprite(context, hasCemento ? SPRITES.check : SPRITES.cross, 150, 28, {
          scale: 1,
        })
        label(
          context,
          hasFurgon ? 'furgón dentro' : 'furgón fuera',
          160,
          26,
          6,
          hasFurgon ? COLORS.coral : COLORS.lime,
        )
        label(
          context,
          hasCemento ? 'cemento dentro' : 'cemento fuera',
          160,
          35,
          6,
          hasCemento ? COLORS.lime : COLORS.coral,
        )
      }

      loads.forEach((_, index) => {
        const x = wagonX(index)
        const chosen = inConvoy(index)
        panel(
          context,
          x + 2,
          105,
          WAGON_W - 4,
          9,
          chosen ? 'rgba(47,107,58,0.9)' : 'rgba(20,16,36,0.8)',
          chosen ? COLORS.green : '#4a3f5c',
        )
        label(
          context,
          String(index),
          x + WAGON_W / 2,
          112,
          6,
          chosen ? COLORS.lime : THEME.muted,
          'center',
        )
      })

      if (view.formed) {
        for (let index = 0; index < 8; index += 1) {
          const progress = reduced ? 0.5 : ((time / 1300 + index / 8) % 1)
          const x = Math.round(38 + rand(index + 21) * 110)
          context.globalAlpha = 0.85 * (1 - progress * 0.6)
          rect(context, x, Math.round(58 - progress * 26), 1, 2, index % 2 === 0 ? COLORS.gold : COLORS.lime)
        }
        context.globalAlpha = 1
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'convoy') continue
      setView({ full: step.full, convoy: step.convoy, formed: step.formed })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.formed
    ? `El convoy lleva ${view.convoy.length} vagones: ${view.convoy.join(', ')}. El furgón se queda fuera.`
    : `El tren largo tiene ${TRAIN_FULL.length} vagones, de la locomotora al furgón.`

  return <PixelCanvas label={description} draw={draw} />
}
