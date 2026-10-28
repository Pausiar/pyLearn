import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { DICE_SEED } from '../../engine/dice'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  dither,
  disc,
  gradient,
  label,
  line,
  panel,
  rand,
  rect,
  speckle,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface DiceView {
  rolls: number[]
  average: number
  shown: boolean
}

const RESTING: DiceView = { rolls: [], average: 0, shown: false }

const DIE_X = [54, 92, 130]
const DIE_Y = 32
const DIE_SIZE = 32

const PIPS: Record<number, readonly (readonly [number, number])[]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [2, 0],
    [0, 2],
    [2, 2],
  ],
  5: [
    [0, 0],
    [2, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ],
  6: [
    [0, 0],
    [2, 0],
    [0, 1],
    [2, 1],
    [0, 2],
    [2, 2],
  ],
}

function drawTable(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 0, 224, 128, '#3a2418', '#22140e', 8)
  for (let y = 16; y < 128; y += 22) {
    rect(context, 0, y, 224, 1, alpha(COLORS.ink, 0.35))
    rect(context, 0, y + 1, 224, 1, alpha(COLORS.woodLight, 0.15))
  }
  for (let index = 0; index < 26; index += 1) {
    const x = Math.round(rand(index + 4) * 224)
    const y = Math.round(rand(index + 31) * 128)
    rect(context, x, y, 6 + Math.round(rand(index + 8) * 22), 1, alpha(COLORS.woodDark, 0.4))
  }
  speckle(context, 0, 0, 224, 128, alpha(COLORS.ink, 0.2), 11, 26)

  rect(context, 0, 0, 224, 5, alpha(COLORS.ink, 0.5))
  rect(context, 0, 123, 224, 5, alpha(COLORS.ink, 0.5))

  if (!reduced) {
    for (let index = 0; index < 7; index += 1) {
      const progress = (time / 6200 + rand(index + 71)) % 1
      context.globalAlpha = 0.16 * (1 - progress)
      rect(
        context,
        Math.round(12 + rand(index + 13) * 200),
        Math.round(8 + progress * 108),
        1,
        1,
        COLORS.cream,
      )
    }
    context.globalAlpha = 1
  }
}

function drawCloth(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  rect(context, 44, 18, 124, 76, '#163a30')
  rect(context, 44, 18, 124, 1, '#2f6b58')
  rect(context, 44, 18, 1, 76, '#2f6b58')
  rect(context, 44, 93, 124, 1, '#0d241e')
  dither(context, 44, 18, 124, 76, alpha(COLORS.ink, 0.15), 3)

  rect(context, 50, 24, 112, 1, alpha(COLORS.gold, 0.16))
  rect(context, 50, 88, 112, 1, alpha(COLORS.gold, 0.16))
  for (let x = 46; x < 168; x += 6) {
    rect(context, x, 95, 2, 2, alpha(COLORS.gold, 0.25))
    rect(context, x, 16, 2, 1, alpha(COLORS.gold, 0.2))
  }

  const pulse = reduced ? 0.5 : 0.35 + 0.2 * Math.sin(time / 600)
  context.globalAlpha = pulse
  rect(context, 66, 42, 80, 1, alpha(COLORS.lime, 0.16))
  rect(context, 66, 54, 80, 1, alpha(COLORS.lime, 0.08))
  context.globalAlpha = 1
}

function drawCandle(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  const flicker = reduced ? 1 : 0.75 + 0.25 * Math.sin(time / 90) * Math.sin(time / 57)
  context.globalAlpha = 0.1 * flicker
  disc(context, 23, 36, 18, COLORS.gold)
  context.globalAlpha = 0.16 * flicker
  disc(context, 23, 36, 11, COLORS.yellow)
  context.globalAlpha = 1

  rect(context, 14, 70, 18, 6, '#6a5540')
  rect(context, 14, 70, 18, 1, '#8a7a5c')
  rect(context, 18, 64, 10, 7, '#4a3a2a')
  rect(context, 19, 64, 8, 1, '#8a7a5c')
  rect(context, 20, 44, 8, 21, '#efe0c2')
  rect(context, 20, 44, 8, 1, '#fff4dc')
  rect(context, 20, 44, 2, 21, '#d8c8a8')
  rect(context, 20, 52, 1, 4, '#d8c8a8')
  rect(context, 27, 48, 1, 3, '#d8c8a8')
  rect(context, 23, 41, 2, 4, COLORS.ink)
  rect(context, 23, 40, 2, 1, '#5c3a1c')

  context.globalAlpha = flicker
  rect(context, 23, 36, 2, 4, COLORS.orange)
  rect(context, 23, 34, 2, 2, COLORS.gold)
  rect(context, 23, 32, 1, 2, COLORS.cream)
  context.globalAlpha = 1
  if (!reduced) {
    rect(context, 24 + Math.round(Math.sin(time / 300) * 2), 30, 1, 1, alpha(COLORS.cream, 0.6))
  }
}

function drawSigns(context: CanvasRenderingContext2D): void {
  rect(context, 8, 4, 52, 12, '#5c3a1c')
  rect(context, 8, 4, 52, 1, '#8a5a2b')
  rect(context, 8, 15, 52, 1, '#3a2414')
  rect(context, 10, 6, 2, 2, COLORS.silver)
  rect(context, 56, 6, 2, 2, COLORS.silver)
  label(context, 'SEMILLA', 14, 13, 5, '#d9b878')
  label(context, String(DICE_SEED), 50, 13, 7, COLORS.gold, 'right')

  rect(context, 66, 4, 86, 12, '#4a2f18')
  rect(context, 66, 4, 86, 1, '#7a5028')
  rect(context, 66, 15, 86, 1, '#2a1810')
  label(context, 'MESA DE DADOS', 109, 13, 5, '#d9b878', 'center')
  rect(context, 70, 6, 2, 2, alpha(COLORS.silver, 0.6))
  rect(context, 146, 6, 2, 2, alpha(COLORS.silver, 0.6))
}

function drawDie(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  roll: number | undefined,
  index: number,
  newest: boolean,
  time: number,
  reduced: boolean,
): void {
  if (roll === undefined) {
    rect(context, x, y, DIE_SIZE, DIE_SIZE, alpha(COLORS.ink, 0.35))
    panel(context, x, y, DIE_SIZE, DIE_SIZE, 'rgba(10,30,26,0.6)', alpha(COLORS.gold, 0.22))
    label(context, '?', x + DIE_SIZE / 2, y + 24, 13, alpha(COLORS.gold, 0.3), 'center')
    return
  }

  rect(context, x - 1, y + 3, DIE_SIZE + 3, DIE_SIZE, alpha(COLORS.ink, 0.4))
  rect(context, x - 2, y + DIE_SIZE - 2, DIE_SIZE + 5, 1, alpha(COLORS.ink, 0.35))

  bevel(context, x, y, DIE_SIZE, DIE_SIZE, '#efe3c8', '#fff7e2', '#b9a888', COLORS.woodDark)
  rect(context, x + 1, y + 1, DIE_SIZE - 2, 2, '#f8eed8')
  rect(context, x + 1, y + DIE_SIZE - 3, DIE_SIZE - 2, 1, '#d8c8a8')
  rect(context, x + DIE_SIZE - 3, y + 2, 1, DIE_SIZE - 4, '#d8c8a8')
  rect(context, x + 3, y + 3, 8, 1, alpha(COLORS.paper, 0.7))

  for (const [column, row] of PIPS[roll] ?? []) {
    const cx = x + 8 + column * 8
    const cy = y + 8 + row * 8
    rect(context, cx - 1, cy - 1, 3, 3, '#3a2430')
    rect(context, cx - 1, cy - 1, 1, 1, '#5a4050')
  }

  if (index === 0) {
    rect(context, x + 2, y + DIE_SIZE - 6, 4, 2, alpha(COLORS.brickDark, 0.35))
  }

  if (newest) {
    const shine = reduced ? 8 : (time / 22 + index * 5) % (DIE_SIZE + 14) - 7
    if (shine > 0 && shine < DIE_SIZE) {
      context.globalAlpha = 0.3
      line(context, x + shine, y + 2, x + shine - 10, y + DIE_SIZE - 2, COLORS.paper)
      context.globalAlpha = 1
    }
    context.globalAlpha = reduced ? 0.4 : 0.25 + 0.2 * Math.sin(time / 200)
    rect(context, x, y, DIE_SIZE, 1, COLORS.gold)
    rect(context, x, y + DIE_SIZE - 1, DIE_SIZE, 1, alpha(COLORS.gold, 0.5))
    context.globalAlpha = 1
  }
}

function drawAverageCard(
  context: CanvasRenderingContext2D,
  view: DiceView,
  time: number,
  reduced: boolean,
): void {
  rect(context, 174, 10, 44, 74, alpha(COLORS.ink, 0.45))
  rect(context, 172, 8, 44, 74, '#efe2c4')
  rect(context, 172, 8, 44, 1, '#fff4dc')
  rect(context, 172, 8, 44, 12, COLORS.brick)
  rect(context, 172, 8, 44, 1, '#d06a4a')
  label(context, 'MEDIA', 194, 17, 6, COLORS.cream, 'center')
  disc(context, 178, 11, 1, '#e8a090')
  disc(context, 210, 11, 1, '#e8a090')

  label(context, 'suma ÷ 3', 194, 30, 4, '#8a7a5c', 'center')
  if (view.shown) {
    const pulse = reduced ? 1 : 0.8 + 0.2 * Math.sin(time / 280)
    context.globalAlpha = pulse
    rect(context, 178, 34, 32, 28, 'rgba(47,107,58,0.18)')
    label(context, String(view.average), 194, 56, 18, COLORS.forest, 'center')
    context.globalAlpha = 1
    drawSprite(context, SPRITES.star, 178, 62, { scale: 1, palette: { y: COLORS.gold } })
    label(context, '3 TIRADAS', 194, 73, 4, '#6a5a48', 'center')
  } else {
    label(context, '—', 194, 56, 16, '#b7a888', 'center')
    label(context, `${view.rolls.length} TIRADAS`, 194, 73, 4, '#9a8a70', 'center')
  }

  const sum = view.rolls.reduce((total, roll) => total + roll, 0)
  label(context, `Σ ${sum}`, 194, 79, 4, view.shown ? COLORS.brickDark : '#9a8a70', 'center')

  if (view.shown) {
    for (let index = 0; index < 6; index += 1) {
      const progress = reduced ? 0.6 : (time / 1600 + index / 6) % 1
      context.globalAlpha = 0.6 * (1 - progress)
      rect(
        context,
        Math.round(176 + rand(index + 3) * 36),
        Math.round(34 - progress * 14),
        1,
        1,
        COLORS.gold,
      )
    }
    context.globalAlpha = 1
  }
}

function drawProps(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  rect(context, 8, 98, 30, 18, alpha(COLORS.ink, 0.4))
  rect(context, 10, 94, 24, 20, '#7a5028')
  rect(context, 10, 94, 24, 2, '#a86a3a')
  rect(context, 10, 112, 24, 2, '#4a2f18')
  rect(context, 12, 97, 20, 6, '#5c3a1c')
  rect(context, 13, 98, 18, 3, '#e8dcc0')
  rect(context, 33, 98, 5, 10, '#4a2f18')
  rect(context, 33, 98, 2, 10, '#7a5028')
  if (!reduced) {
    context.globalAlpha = 0.25
    rect(context, 16, 94 + Math.round(Math.sin(time / 800) * 1), 14, 2, COLORS.cream)
    context.globalAlpha = 1
  }

  for (let stack = 0; stack < 3; stack += 1) {
    for (let coin = 0; coin < stack + 1; coin += 1) {
      disc(context, 92 + stack * 12, 108 - coin * 3, 3, COLORS.gold)
      rect(context, 92 + stack * 12 - 2, 107 - coin * 3, 1, 1, '#f5d98a')
    }
  }

  rect(context, 170, 96, 34, 20, '#3a2418')
  rect(context, 170, 96, 34, 2, '#6a4420')
  rect(context, 172, 98, 30, 14, '#24160f')
  rect(context, 172, 98, 30, 1, '#4a2f18')
  rect(context, 196, 100, 3, 10, '#5c3a1c')
  rect(context, 172, 106, 24, 6, '#4a2f18')
  rect(context, 172, 106, 24, 1, '#7a5028')

  rect(context, 136, 100, 24, 12, '#24160f')
  rect(context, 136, 100, 24, 1, '#4a2f18')
  label(context, 'DADOS', 148, 108, 3, '#8a7a5c', 'center')
}

/** La mesa: los tres dados, la vela y la tarjeta de la media. */
function drawDiceScene(
  context: CanvasRenderingContext2D,
  view: DiceView,
  time: number,
  reduced: boolean,
): void {
  drawTable(context, time, reduced)
  drawCloth(context, time, reduced)
  drawSigns(context)
  drawCandle(context, time, reduced)

  DIE_X.forEach((x, index) => {
    drawDie(
      context,
      x,
      DIE_Y,
      view.rolls[index],
      index,
      index === view.rolls.length - 1 && view.rolls.length > 0,
      time,
      reduced,
    )
  })

  drawAverageCard(context, view, time, reduced)
  drawProps(context, time, reduced)

  if (view.shown) {
    const pulse = reduced ? 0.5 : 0.3 + 0.2 * Math.sin(time / 320)
    context.globalAlpha = pulse
    rect(context, 46, 80, 120, 1, COLORS.gold)
    context.globalAlpha = 1
    for (let index = 0; index < 9; index += 1) {
      const progress = reduced ? 0.5 : (time / 1800 + index / 9) % 1
      context.globalAlpha = 0.65 * (1 - progress)
      rect(
        context,
        Math.round(60 + rand(index + 23) * 102),
        Math.round(70 - progress * 32),
        1,
        1,
        index % 2 === 0 ? COLORS.gold : COLORS.lime,
      )
    }
    context.globalAlpha = 1
  }
}

/** Lienzo de los dados: las tres tiradas de la semilla y su media entera. */
export function DiceScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<DiceView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawDiceScene(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'dice') continue
      setView({ rolls: step.rolls, average: step.average, shown: step.shown })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 340)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.rolls.length === 0
      ? 'La mesa está preparada: tres dados y la semilla 7.'
      : `Han salido ${view.rolls.join(', ')}.${view.shown ? ` La media entera es ${view.average}.` : ''}`

  return <PixelCanvas label={description} draw={draw} />
}
