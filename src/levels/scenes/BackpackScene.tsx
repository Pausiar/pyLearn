import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { BACKPACK_CAPACITY, BACKPACK_GOAL } from '../../engine/backpack'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bar,
  bevel,
  cloud,
  disc,
  dither,
  glow,
  gradient,
  groundTexture,
  hills,
  label,
  line,
  panel,
  rand,
  rect,
  ring,
  speckle,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface BackpackView {
  ropes: number
  canteens: number
  placed: boolean
}

const RESTING: BackpackView = { ropes: 0, canteens: 0, placed: false }

function countColour(value: number, goal: number): string {
  if (value === goal) return COLORS.lime
  if (value > goal) return COLORS.coral
  return value === 0 ? '#7f9a86' : COLORS.sand
}

function drawRope(context: CanvasRenderingContext2D, x: number, y: number, colour: string): void {
  ring(context, x + 4, y + 3, 3, colour)
  rect(context, x + 2, y + 6, 5, 1, alpha(COLORS.ink, 0.45))
  rect(context, x + 3, y + 1, 3, 1, alpha(COLORS.cream, 0.55))
}

function drawCanteen(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: string,
  filled: boolean,
): void {
  rect(context, x, y + 2, 6, 8, filled ? '#4a5568' : '#314037')
  rect(context, x + 1, y + 2, 4, 7, colour)
  rect(context, x + 2, y, 2, 2, filled ? '#2a3147' : '#314037')
  if (filled) {
    rect(context, x + 2, y + 4, 2, 3, COLORS.water)
    rect(context, x + 1, y + 2, 1, 6, alpha(COLORS.paper, 0.35))
  }
}

function drawTent(context: CanvasRenderingContext2D): void {
  rect(context, 140, 98, 84, 6, '#2c3a24')

  for (let row = 0; row < 25; row += 1) {
    const y = 52 + row * 2
    const half = Math.round(2 + (y - 52) * 0.76)
    const x = 184 - half
    rect(context, x, y, half * 2, 2, '#e5d3b0')
    rect(context, 184, y, half, 2, '#cdb68d')
    rect(context, x, y, half * 2, 1, '#f6e8c8')
  }

  // Puerta y faldones.
  for (let row = 0; row < 13; row += 1) {
    const y = 74 + row * 2
    const half = Math.round(2 + (y - 74) * 0.62)
    rect(context, 184 - half, y, half * 2, 2, '#2a2018')
  }
  rect(context, 170, 92, 3, 6, '#d9c49a')
  rect(context, 195, 92, 3, 6, '#b8a076')
  rect(context, 184, 50, 1, 2, '#f6e8c8')

  line(context, 184, 50, 142, 100, '#6b5636')
  line(context, 184, 50, 222, 100, '#8a7250')
  rect(context, 139, 98, 4, 2, COLORS.wood)
  rect(context, 220, 98, 4, 2, COLORS.wood)
  rect(context, 184, 44, 1, 7, COLORS.steel)
  rect(context, 185, 44, 6, 3, COLORS.coral)
  rect(context, 185, 47, 3, 1, COLORS.coral)

  glow(context, 222, 72, 10, COLORS.gold, 0.1)
  rect(context, 218, 70, 3, 5, COLORS.gold)
  rect(context, 219, 71, 1, 3, COLORS.yellow)
}

function drawChecklist(
  context: CanvasRenderingContext2D,
  view: BackpackView,
  complete: boolean,
): void {
  const total = view.ropes + view.canteens

  panel(context, 8, 8, 112, 52, 'rgba(12,26,20,0.9)', complete ? COLORS.green : '#4f7a58')
  label(context, 'LISTA DE CARGA', 14, 20, 6, COLORS.cream)
  rect(context, 14, 23, 96, 1, alpha(COLORS.cream, 0.25))

  label(context, 'CUERDAS', 14, 36, 6, COLORS.paper)
  for (let index = 0; index < BACKPACK_GOAL.ropes; index += 1) {
    drawRope(context, 56 + index * 9, 29, index < view.ropes ? COLORS.sand : '#3a4a40')
  }
  label(context, `${view.ropes}/${BACKPACK_GOAL.ropes}`, 108, 36, 6, countColour(view.ropes, BACKPACK_GOAL.ropes), 'right')

  label(context, 'AGUA', 14, 49, 6, COLORS.paper)
  for (let index = 0; index < BACKPACK_GOAL.canteens; index += 1) {
    drawCanteen(context, 56 + index * 9, 41, index < view.canteens ? '#a8b6c4' : '#3a4a40', index < view.canteens)
  }
  label(context, `${view.canteens}/${BACKPACK_GOAL.canteens}`, 108, 49, 6, countColour(view.canteens, BACKPACK_GOAL.canteens), 'right')

  bar(
    context,
    14,
    52,
    54,
    4,
    total / BACKPACK_CAPACITY,
    total > BACKPACK_CAPACITY ? COLORS.coral : total === BACKPACK_CAPACITY ? COLORS.gold : COLORS.moss,
    alpha(COLORS.paper, 0.14),
  )
  label(context, `CARGA ${total}/${BACKPACK_CAPACITY}`, 73, 57, 5, '#9fb69a')
  if (complete) drawSprite(context, SPRITES.check, 103, 11, { scale: 1, palette: { g: COLORS.lime } })
}

function drawCampfire(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  const flicker = reduced ? 0 : Math.round(Math.sin(time / 95) * 1.2)
  glow(context, 140, 108, 18, COLORS.orange, reduced ? 0.14 : 0.13 + Math.sin(time / 120) * 0.04)
  rect(context, 133, 111, 16, 3, COLORS.woodDark)
  rect(context, 136, 109, 10, 3, COLORS.wood)
  rect(context, 138, 104 + flicker, 5, 8 - flicker, COLORS.orange)
  rect(context, 139, 101 + flicker, 3, 6, COLORS.gold)
  rect(context, 139, 107, 2, 3, COLORS.yellow)

  if (!reduced) {
    for (let index = 0; index < 3; index += 1) {
      const phase = (time / 900 + index / 3) % 1
      const x = 140 + Math.round(Math.sin(phase * 6 + index) * 3)
      rect(context, x, Math.round(102 - phase * 15), 1, 1, alpha(COLORS.gold, 0.6 * (1 - phase)))
    }
  }
}

/** Lienzo del campamento: la lista de carga y la mochila con lo que lleva dentro. */
export function BackpackScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<BackpackView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      gradient(context, 0, 0, 224, 64, '#3a3566', '#e88a5a', 10)
      dither(context, 0, 0, 224, 40, alpha(COLORS.ink, 0.16), 3)

      const sunY = 38
      glow(context, 150, sunY, 20, COLORS.gold, 0.2)
      disc(context, 150, sunY, 8, COLORS.gold)
      disc(context, 149, sunY - 1, 6, COLORS.yellow)
      cloud(context, 124, 14, 28, '#a86a72', '#7d4a5a')
      cloud(context, 196, 22, 24, '#c98a84', '#a05a66')

      hills(context, 66, 16, '#6a5a7a', 5)
      hills(context, 68, 9, '#4e5a48', 13)
      groundTexture(context, 0, 64, 224, 64, '#4e6b3a', '#6d8a4c', '#314a2b', 7)
      speckle(context, 0, 64, 224, 64, alpha(COLORS.ink, 0.18), 51, 26)

      drawTent(context)

      // Claro de tierra bajo el equipo.
      disc(context, 84, 112, 40, '#5e5236')
      disc(context, 86, 114, 34, '#6b5c3d')
      speckle(context, 50, 92, 70, 30, '#8a7450', 77, 16)

      // Huecos para las cuerdas y las cantimploras.
      for (let index = 0; index < BACKPACK_GOAL.ropes; index += 1) {
        rect(context, 108, 82 + index * 9, 9, 7, '#37452e')
        rect(context, 109, 83 + index * 9, 7, 5, '#46553a')
      }
      for (let index = 0; index < BACKPACK_GOAL.canteens; index += 1) {
        rect(context, 122, 84 + index * 12, 7, 10, '#37452e')
        rect(context, 123, 85 + index * 12, 5, 8, '#46553a')
      }
      for (let index = 0; index < Math.min(view.ropes, BACKPACK_GOAL.ropes); index += 1) {
        drawRope(context, 108, 82 + index * 9, COLORS.sand)
      }
      for (let index = 0; index < Math.min(view.canteens, BACKPACK_GOAL.canteens); index += 1) {
        drawCanteen(context, 122, 84 + index * 12, '#a8b6c4', true)
      }
      if (view.ropes > BACKPACK_GOAL.ropes || view.canteens > BACKPACK_GOAL.canteens) {
        label(context, '¡SOBRA CARGA!', 120, 118, 5, COLORS.coral, 'center')
      }

      drawCampfire(context, time, reduced)

      const exact =
        view.placed &&
        view.ropes === BACKPACK_GOAL.ropes &&
        view.canteens === BACKPACK_GOAL.canteens

      drawChecklist(context, view, exact)

      rect(context, 14, 118, 40, 3, alpha(COLORS.ink, 0.32))
      rect(context, 62, 118, 44, 3, alpha(COLORS.ink, 0.32))
      if (exact) glow(context, 84, 92, 30, COLORS.gold, 0.12)

      drawSprite(context, SPRITES.explorer, 16, 72, { scale: 3, outline: COLORS.ink })
      bevel(context, 62, 61, 44, 8, '#6a5a8a', '#9682b4', '#3e3458', COLORS.ink)
      rect(context, 70, 62, 2, 6, '#4a3a6a')
      rect(context, 94, 62, 2, 6, '#4a3a6a')
      drawSprite(context, SPRITES.backpack, 64, 64, {
        scale: 4,
        outline: COLORS.ink,
        palette: { u: COLORS.woodLight, n: COLORS.woodDark },
      })

      if (exact) {
        glow(context, 88, 66, 16, COLORS.lime, 0.12)
        drawSprite(context, SPRITES.spark, 56, 74, { scale: 1 })
      }

      panel(context, 158, 56, 58, 13, 'rgba(18,28,18,0.85)', exact ? COLORS.green : '#6a7a52')
      label(
        context,
        exact ? '¡A LA RUTA!' : view.placed ? 'REVISAR' : 'PREPARANDO',
        187,
        65,
        6,
        exact ? COLORS.lime : COLORS.cream,
        'center',
      )

      if (exact) {
        for (let index = 0; index < 3; index += 1) {
          const phase = reduced ? (index + 1) / 4 : (time / 1600 + index / 3) % 1
          const x = 146 + Math.round(Math.sin(phase * 5 + index) * 6)
          rect(context, x, Math.round(46 - phase * 18), 1, 1, alpha(COLORS.cream, 0.6 * (1 - phase)))
        }
      }

      for (let index = 0; index < 7; index += 1) {
        const x = 12 + Math.round(rand(index + 3) * 200)
        const y = 104 + Math.round(rand(index + 11) * 20)
        rect(context, x, y, 2, 1, COLORS.moss)
        if (exact && index % 2 === 0) rect(context, x + 1, y - 2, 1, 1, COLORS.gold)
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'backpack') continue
      setView({ ropes: step.ropes, canteens: step.canteens, placed: step.placed })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 520)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.placed
    ? `La mochila lleva ${view.ropes} cuerdas y ${view.canteens} cantimploras; caben ${BACKPACK_CAPACITY} cosas.`
    : 'La mochila está vacía junto a la tienda y el explorador espera la lista de carga.'

  return <PixelCanvas label={description} draw={draw} />
}
