import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import {
  BACKPACK_ITEMS,
  BACKPACK_LIMIT,
  BACKPACK_WEIGHTS,
} from '../../engine/adventurer'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS, THEMES } from '../../pixel/palette'
import {
  alpha,
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
  starfield,
  truncate,
} from '../../pixel/shapes'
import { drawSprite, SPRITES, type SpriteGrid } from '../../pixel/sprites'

const THEME = THEMES[4]
const FIRE_X = 70
const FIRE_BASE = 94

const ITEM_SPRITES: Record<string, SpriteGrid> = {
  espada: SPRITES.sword,
  antorcha: SPRITES.torch,
  cuerda: SPRITES.rope,
  escudo: SPRITES.shield,
  manzana: SPRITES.apple,
  brújula: SPRITES.compass,
}

interface AdventureView {
  items: string[]
  weights: number[]
  light: string[]
  done: boolean
}

const RESTING: AdventureView = { items: [], weights: [], light: [], done: false }

function drawPine(
  context: CanvasRenderingContext2D,
  x: number,
  base: number,
  height: number,
  colour: string,
): void {
  for (let row = 0; row < height; row += 1) {
    const width = Math.round((row / height) * (height * 0.5))
    rect(context, x - width, base - height + row, width * 2 + 1, 1, colour)
  }
  rect(context, x - 1, base + 1, 2, 3, COLORS.woodDark)
}

function drawTent(context: CanvasRenderingContext2D): void {
  const cx = 34
  const top = 56
  const base = 92
  const half = 24
  const height = base - top

  line(context, cx, top + 2, 2, 97, alpha(COLORS.silver, 0.35))
  line(context, cx, top + 2, 66, 97, alpha(COLORS.silver, 0.35))
  rect(context, 2, 96, 1, 2, COLORS.steel)
  rect(context, 66, 96, 1, 2, COLORS.steel)

  for (let row = 0; row < height; row += 1) {
    const halfWidth = Math.round((row / height) * half)
    const band = row % 10 < 5
    rect(context, cx - halfWidth, top + row, halfWidth, 1, band ? '#2f6b5a' : '#28604f')
    rect(context, cx, top + row, halfWidth, 1, band ? '#245244' : '#1e463a')
  }
  rect(context, cx - 1, top, 2, height, '#3f8a72')
  for (let row = 0; row < 16; row += 1) {
    const halfWidth = Math.round((row / 16) * 7)
    rect(context, cx - halfWidth, base - 16 + row, halfWidth * 2 + 1, 1, '#141020')
  }
  line(context, cx - 8, base, cx - 1, base - 16, '#7ccf75')
  line(context, cx + 8, base, cx + 1, base - 16, '#7ccf75')
  rect(context, cx, top - 8, 1, 8, COLORS.woodDark)
  rect(context, cx + 1, top - 8, 4, 2, COLORS.coral)
  rect(context, cx + 1, top - 6, 3, 1, COLORS.coral)
  dither(context, cx - half - 4, base - 2, half * 2 + 8, 5, alpha(COLORS.ink, 0.3), 2)
}

function drawCampfire(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  glow(
    context,
    FIRE_X,
    FIRE_BASE - 8,
    22,
    COLORS.orange,
    reduced ? 0.22 : 0.2 + 0.06 * Math.sin(time / 180),
  )
  rect(context, FIRE_X - 8, FIRE_BASE - 4, 16, 2, COLORS.woodDark)
  rect(context, FIRE_X - 6, FIRE_BASE - 6, 12, 2, COLORS.wood)
  for (let index = -2; index <= 2; index += 1) {
    disc(
      context,
      FIRE_X + index * 6,
      FIRE_BASE - 1,
      2,
      index % 2 === 0 ? COLORS.stone : '#4a4050',
    )
  }

  const sway = reduced ? 0 : Math.round(Math.sin(time / 130) * 1.5)
  const flames = [
    { x: FIRE_X - 7, height: 7, width: 4, colour: COLORS.orange },
    { x: FIRE_X - 3, height: 12, width: 6, colour: COLORS.gold },
    { x: FIRE_X + 3, height: 7, width: 4, colour: COLORS.orange },
  ]
  flames.forEach((flame, index) => {
    const flicker = reduced ? 0 : Math.round(Math.sin(time / 100 + index * 2) * 1.5)
    const height = flame.height + flicker
    rect(
      context,
      flame.x + (index === 1 ? sway : 0),
      FIRE_BASE - 5 - height,
      flame.width,
      height,
      flame.colour,
    )
  })
  rect(context, FIRE_X - 1 + sway, FIRE_BASE - 13, 2, 4, COLORS.cream)

  for (let index = 0; index < 3; index += 1) {
    const progress = reduced ? (index + 1) / 4 : ((time / 1700 + index / 3) % 1)
    const px = FIRE_X + Math.round(Math.sin(progress * 5 + index) * 4)
    const py = Math.round(FIRE_BASE - 18 - progress * 22)
    disc(context, px, py, 2 + Math.round(progress * 3), alpha(COLORS.paper, 0.18 * (1 - progress)))
  }

  if (!reduced) {
    for (let index = 0; index < 4; index += 1) {
      const progress = (time / 900 + index * 0.27) % 1
      const x = FIRE_X - 10 + Math.round(rand(index + 5) * 22)
      context.globalAlpha = 0.8 * (1 - progress)
      rect(context, x, Math.round(FIRE_BASE - 10 - progress * 20), 1, 1, COLORS.gold)
    }
    context.globalAlpha = 1
  }
}

function drawAdventure(
  context: CanvasRenderingContext2D,
  view: AdventureView,
  time: number,
  reduced: boolean,
): void {
  const items = view.items.length > 0 ? view.items : [...BACKPACK_ITEMS]
  const weights = items.map(
    (_, index) => view.weights[index] ?? BACKPACK_WEIGHTS[index] ?? 0,
  )

  gradient(context, 0, 0, 224, 70, THEME.skyTop, THEME.skyBottom, 10)
  starfield(context, 0, 0, 224, 40, COLORS.ice, 27, 16, time, reduced)
  glow(context, 202, 14, 13, COLORS.cream, 0.24)
  disc(context, 202, 14, 6, COLORS.cream)
  disc(context, 199, 12, 3, COLORS.yellow)
  cloud(context, 22, 24, 28, '#5a4a78', '#463a62')
  cloud(context, 126, 16, 22, '#5a4a78', '#463a62')
  hills(context, 60, 15, THEME.silhouette, 11)
  hills(context, 66, 9, '#2b2438', 23, 3)
  groundTexture(context, 0, 66, 224, 62, '#2b2438', '#443a54', '#1a1626', 37)
  rect(context, 0, 66, 224, 1, '#5a4a78')

  drawPine(context, 7, 68, 20, '#1e3a34')
  drawPine(context, 21, 70, 14, '#1e3a34')
  drawPine(context, 213, 68, 22, '#1e3a34')
  drawPine(context, 197, 71, 14, '#1e3a34')

  drawTent(context)
  drawCampfire(context, time, reduced)

  drawSprite(context, SPRITES.explorer, 88, 56, { scale: 2, outline: COLORS.ink })
  if (view.done) {
    drawSprite(context, SPRITES.backpack, 84, 74, { scale: 1, outline: COLORS.ink })
    glow(context, 96, 84, 10, COLORS.gold, 0.25)
  }
  drawSprite(context, SPRITES.backpack, 118, 62, { scale: 2, outline: COLORS.ink })

  panel(context, 6, 6, 92, 13, 'rgba(20,14,30,0.8)', '#4a3f5c')
  label(context, 'CAMPAMENTO BASE', 12, 15, 7, COLORS.paper)

  panel(
    context,
    148,
    6,
    70,
    88,
    'rgba(20,14,30,0.86)',
    view.done ? COLORS.lime : '#4a3f5c',
  )
  label(
    context,
    'LIGERA',
    154,
    18,
    7,
    view.done ? COLORS.lime : THEME.muted,
  )
  rect(context, 152, 22, 62, 1, '#4a3f5c')
  if (view.light.length === 0) {
    label(context, 'vacía', 183, 46, 7, THEME.muted, 'center')
    label(context, `objetos ≤ ${BACKPACK_LIMIT} kg`, 183, 58, 6, THEME.muted, 'center')
  } else {
    view.light.slice(0, 4).forEach((item, index) => {
      const row = 36 + index * 14
      drawSprite(context, SPRITES.check, 154, row - 6, { scale: 1 })
      label(context, truncate(item, 11), 164, row, 7, COLORS.paper)
    })
    label(context, `${view.light.length} objetos`, 212, 88, 6, COLORS.lime, 'right')
  }
  if (view.done) {
    for (let index = 0; index < 6; index += 1) {
      const twinkle = reduced ? 1 : 0.4 + 0.6 * Math.abs(Math.sin(time / 500 + index))
      context.globalAlpha = twinkle
      rect(
        context,
        150 + Math.round(rand(index + 31) * 64),
        8 + Math.round(rand(index + 47) * 80),
        1,
        1,
        index % 2 === 0 ? COLORS.gold : COLORS.lime,
      )
    }
    context.globalAlpha = 1
  }

  rect(context, 0, 94, 224, 34, 'rgba(20,14,30,0.74)')
  rect(context, 0, 94, 224, 1, '#5a4a78')

  items.slice(0, 6).forEach((item, index) => {
    const x = 3 + index * 36
    const weight = weights[index] ?? 0
    const light = weight <= BACKPACK_LIMIT
    const chosen = view.done && view.light.includes(item)
    const sprite = ITEM_SPRITES[item] ?? SPRITES.crate
    const spriteWidth = Math.max(...sprite.map((row) => row.length))

    panel(
      context,
      x,
      97,
      34,
      28,
      'rgba(28,22,42,0.92)',
      chosen ? COLORS.lime : light ? '#2f6b3a' : '#4a3f5c',
    )
    drawSprite(context, sprite, x + Math.round((34 - spriteWidth) / 2), 99, {
      scale: 1,
    })
    label(
      context,
      truncate(item, 8),
      x + 17,
      118,
      6,
      light ? COLORS.paper : THEME.muted,
      'center',
    )
    label(context, `${weight} kg`, x + 17, 125, 6, light ? COLORS.lime : COLORS.coral, 'center')
    if (chosen) drawSprite(context, SPRITES.check, x + 25, 98, { scale: 1 })
  })
}

/** Lienzo del campamento: la mochila grande, el fuego y la mochila ligera. */
export function AdventureScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<AdventureView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawAdventure(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'adventure') continue
      setView({ items: step.items, weights: step.weights, light: step.light, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const items = view.items.length > 0 ? view.items : [...BACKPACK_ITEMS]
  const weights = items.map(
    (_, index) => view.weights[index] ?? BACKPACK_WEIGHTS[index] ?? 0,
  )
  const description = view.done
    ? `El aventurero sale con la mochila ligera: ${view.light.join(', ')}.`
    : `La mochila grande lleva ${items
        .map((item, index) => `${item}, ${weights[index]} kilos`)
        .join('; ')}.`

  return <PixelCanvas label={description} draw={draw} />
}
