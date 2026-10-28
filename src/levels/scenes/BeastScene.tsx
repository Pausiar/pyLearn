import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { BEAST_LIFE, BEAST_NAME, BEAST_ROAR } from '../../engine/beasts'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  disc,
  dither,
  glow,
  gradient,
  label,
  line,
  panel,
  rand,
  rect,
  ring,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface BeastView {
  name: string
  life: number
  born: boolean
}

const RESTING: BeastView = { name: BEAST_NAME, life: BEAST_LIFE, born: false }

function drawStalactite(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  for (let row = 0; row < height; row += 1) {
    const shrink = Math.round((row / height) * (width / 2))
    rect(context, x + shrink, y + row, Math.max(1, width - shrink * 2), 1, row % 5 === 0 ? '#3a2a4a' : '#241a30')
  }
}

function drawWing(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  const sway = reduced ? 0 : Math.round(Math.sin(time / 900) * 2)
  for (let row = 0; row < 30; row += 1) {
    const ratio = row / 29
    const left = Math.round(50 - 16 * ratio + sway * ratio)
    const right = Math.round(52 + 32 * ratio)
    rect(context, left, 32 + row, right - left, 1, row % 6 === 0 ? '#4a3268' : '#3c2856')
  }
  line(context, 84, 61, 48, 32, alpha('#6a4a9a', 0.8))
  line(context, 84, 61, 42, 40, alpha('#6a4a9a', 0.55))
  line(context, 84, 61, 38, 50, alpha('#6a4a9a', 0.45))
  rect(context, 46, 30, 3, 2, '#e8d9b0')
  rect(context, 49, 29, 2, 2, '#d9b878')
}

function drawHoard(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  disc(context, 48, 106, 16, '#6a4a12')
  disc(context, 80, 107, 22, '#6a4a12')
  disc(context, 112, 106, 12, '#6a4a12')
  disc(context, 42, 102, 7, '#8a6a12')
  disc(context, 42, 100, 5, '#c9a227')
  disc(context, 40, 99, 2, '#ffe08a')
  disc(context, 68, 103, 9, '#8a6a12')
  disc(context, 68, 101, 7, '#d9a63a')
  disc(context, 66, 99, 3, '#ffe08a')
  disc(context, 106, 102, 6, '#8a6a12')
  disc(context, 106, 100, 4, '#c9a227')
  rect(context, 52, 98, 10, 3, '#c9a227')
  rect(context, 52, 98, 10, 1, '#ffe08a')
  rect(context, 88, 99, 12, 3, '#b8912a')
  rect(context, 88, 99, 12, 1, '#e8c34a')
  for (let index = 0; index < 22; index += 1) {
    const x = 30 + Math.round(rand(index + 8) * 96)
    const y = 98 + Math.round(rand(index + 41) * 8)
    const coin = index % 3 === 0
    rect(context, x, y, coin ? 4 : 3, 2, index % 2 === 0 ? COLORS.gold : '#d9a63a')
    rect(context, x, y, coin ? 4 : 3, 1, '#ffe08a')
  }
  if (!reduced) {
    for (let index = 0; index < 5; index += 1) {
      const twinkle = 0.3 + 0.5 * Math.abs(Math.sin(time / 420 + index * 1.7))
      context.globalAlpha = twinkle
      const x = 34 + Math.round(rand(index + 61) * 92)
      const y = 96 + Math.round(rand(index + 13) * 8)
      rect(context, x, y, 1, 1, COLORS.cream)
      rect(context, x - 1, y, 1, 1, alpha(COLORS.cream, 0.5))
      rect(context, x + 1, y, 1, 1, alpha(COLORS.cream, 0.5))
      context.globalAlpha = 1
    }
  }
}

function drawDragon(context: CanvasRenderingContext2D, view: BeastView, time: number, reduced: boolean): void {
  const born = view.born
  const bob = reduced ? 0 : Math.sin(time / 760) > 0.55 ? -1 : 0
  const tail = reduced ? 0 : Math.round(Math.sin(time / 620))

  drawWing(context, time, reduced)

  rect(context, 40, 90, 22, 5, '#5a3f96')
  rect(context, 28, 84, 16, 6, '#4a2f7a')
  rect(context, 18, 76 + tail, 10, 8, '#5a3f96')
  rect(context, 12, 72 + tail, 7, 4, '#8263c2')
  rect(context, 9, 69 + tail, 4, 4, '#8a6ac2')
  rect(context, 9, 69 + tail, 3, 1, '#c9a7ff')
  rect(context, 40, 90, 22, 1, '#8263c2')

  drawHoard(context, time, reduced)

  disc(context, 64, 94, 10, '#4a2f7a')
  disc(context, 60, 100, 7, '#3c2856')
  rect(context, 52, 101, 4, 3, '#e8d9b0')
  rect(context, 57, 102, 4, 3, '#e8d9b0')
  rect(context, 62, 101, 4, 3, '#e8d9b0')

  disc(context, 98, 96, 9, '#5a3f96')
  disc(context, 100, 102, 6, '#4a2f7a')
  rect(context, 96, 103, 4, 3, '#e8d9b0')
  rect(context, 101, 104, 4, 3, '#e8d9b0')
  rect(context, 106, 103, 4, 3, '#e8d9b0')

  disc(context, 82, 84, 27, '#3c2856')
  disc(context, 80, 82, 25, '#6f52b0')
  disc(context, 75, 78, 17, '#8263c2')
  rect(context, 66, 82, 6, 4, '#9474cc')

  for (let index = 0; index < 4; index += 1) {
    const width = 28 - index * 3
    rect(context, 66 + index, 86 + index * 5, width, 4, '#c9a7ff')
    rect(context, 66 + index, 86 + index * 5, width, 1, '#e2ccff')
  }

  disc(context, 100, 66, 10, '#8263c2')
  disc(context, 104, 58, 8, '#8a6ac2')
  disc(context, 102, 63, 5, '#9474cc')

  const spikes: [number, number][] = [
    [58, 62],
    [70, 56],
    [82, 53],
    [94, 51],
    [100, 47],
  ]
  for (const [x, y] of spikes) {
    rect(context, x, y - 4, 2, 4, '#e8d9b0')
    rect(context, x + 2, y - 2, 2, 2, '#d9b878')
  }

  const headY = 44 + bob
  rect(context, 100, headY, 20, 12, '#8a6ac2')
  rect(context, 100, headY, 20, 1, '#a98be0')
  rect(context, 118, headY + 8, 10, 7, '#7a5bb0')
  rect(context, 118, headY + 8, 10, 1, '#9d7ce7')
  rect(context, 120, headY + 8, 10, 2, '#5a3f96')
  rect(context, 122, headY + 10, 2, 2, '#5a3f96')
  rect(context, 118, headY + 15, 10, 1, '#4a2f7a')

  rect(context, 102, headY - 7, 2, 6, '#e8d9b0')
  rect(context, 100, headY - 9, 2, 4, '#e8d9b0')
  rect(context, 104, headY - 8, 2, 2, '#d9b878')
  rect(context, 111, headY - 5, 2, 5, '#e8d9b0')
  rect(context, 113, headY - 7, 2, 4, '#d9b878')
  rect(context, 98, headY + 3, 3, 4, '#e05263')
  rect(context, 98, headY + 3, 2, 2, '#ff9e7a')

  if (born) {
    glow(context, 114, headY + 5, 8, COLORS.gold, 0.35)
    rect(context, 112, headY + 4, 5, 3, COLORS.gold)
    rect(context, 114, headY + 4, 1, 3, '#7d2f26')
  } else {
    rect(context, 112, headY + 5, 5, 1, '#4a2f7a')
    rect(context, 111, headY + 4, 1, 1, '#4a2f7a')
  }

  rect(context, 126, headY + 9, 1, 1, '#3c2856')
  if (born) {
    rect(context, 120, headY + 16, 8, 4, '#3c2856')
    rect(context, 120, headY + 16, 8, 1, '#5a3f96')
    rect(context, 121, headY + 16, 1, 2, '#e8d9b0')
    rect(context, 124, headY + 16, 1, 2, '#e8d9b0')
    rect(context, 127, headY + 16, 1, 1, '#e8d9b0')
  } else {
    rect(context, 120, headY + 15, 8, 1, '#5a3f96')
    rect(context, 121, headY + 16, 1, 1, '#e8d9b0')
    rect(context, 124, headY + 16, 1, 1, '#e8d9b0')
  }

  if (!reduced) {
    for (let index = 0; index < 3; index += 1) {
      const lift = (time / 620 + index * 0.33) % 1
      context.globalAlpha = 0.32 * (1 - lift)
      disc(context, 130 + Math.round(lift * 4), headY + 4 - Math.round(lift * 14) - index * 2, 2, COLORS.silver)
      context.globalAlpha = 1
    }
  }

  if (born) {
    if (!reduced) {
      for (let index = 0; index < 7; index += 1) {
        const lift = (time / 700 + index * 0.29) % 1
        context.globalAlpha = 0.7 * (1 - lift)
        rect(context, 36 + Math.round(rand(index + 9) * 90), 102 - Math.round(lift * 26), 1, 1, index % 2 === 0 ? COLORS.coral : COLORS.gold)
        context.globalAlpha = 1
      }
    }
    panel(context, 74, 24, 58, 14, 'rgba(12,8,18,0.9)', COLORS.coral)
    rect(context, 124, 38, 3, 2, 'rgba(12,8,18,0.9)')
    rect(context, 121, 40, 4, 2, 'rgba(12,8,18,0.9)')
    label(context, BEAST_ROAR, 103, 35, 7, '#ffd2c2', 'center')
  } else if (!reduced) {
    const float = (time / 900) % 1
    context.globalAlpha = 0.5 * (1 - float * 0.5)
    label(context, 'z', 127, 39 - Math.round(float * 5), 4, '#9d7ce7')
    label(context, 'z', 131, 33 - Math.round(float * 4), 3, '#8263c2')
    context.globalAlpha = 1
  }
}

function drawCave(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 104, '#120e1c', '#2a1c38', 8)
  dither(context, 0, 0, 224, 104, alpha('#000000', 0.14), 4)
  for (let index = 0; index < 6; index += 1) {
    const x = 10 + index * 24
    const y = 24 + Math.round(rand(index + 3) * 10)
    const radius = 14 + Math.round(rand(index + 17) * 10)
    disc(context, x, y, radius, alpha('#1e1428', 0.55))
  }

  drawStalactite(context, 18, 22, 16, 16)
  drawStalactite(context, 58, 22, 10, 9)
  drawStalactite(context, 96, 22, 18, 20)
  drawStalactite(context, 126, 22, 8, 6)
  drawStalactite(context, 132, 22, 6, 10)

  rect(context, 0, 96, 136, 32, '#241a2e')
  rect(context, 0, 96, 136, 1, '#3a2a48')
  for (let index = 0; index < 26; index += 1) {
    rect(
      context,
      2 + Math.round(rand(index + 5) * 130),
      98 + Math.round(rand(index + 31) * 28),
      1 + Math.round(rand(index + 9) * 2),
      1,
      alpha('#120e1c', 0.55),
    )
  }

  const lava = reduced ? 0.55 : 0.45 + 0.15 * Math.sin(time / 420)
  glow(context, 26, 104, 22, COLORS.orange, 0.18)
  rect(context, 0, 100, 44, 5, '#7d2f26')
  rect(context, 0, 99, 38, 2, alpha(COLORS.coral, lava))
  rect(context, 6, 101, 24, 2, alpha(COLORS.gold, lava * 0.7))
  rect(context, 3, 104, 32, 1, '#e88a3a')
  if (!reduced) {
    for (let index = 0; index < 3; index += 1) {
      const lift = (time / 800 + index * 0.37) % 1
      context.globalAlpha = 0.55 * (1 - lift)
      rect(context, 10 + index * 10, 99 - Math.round(lift * 8), 1, 1, COLORS.gold)
      context.globalAlpha = 1
    }
  }

  glow(context, 126, 90, 11, COLORS.teal, reduced ? 0.1 : 0.08 + 0.04 * Math.sin(time / 500))
  for (const [x, height, half] of [
    [119, 9, 3],
    [125, 15, 4],
    [131, 8, 3],
  ] as const) {
    for (let row = 0; row < height; row += 1) {
      const ratio = row / (height - 1)
      const width = Math.max(1, Math.round(half * (0.35 + 0.65 * ratio)))
      rect(context, x - width, 96 - height + row, width * 2, 1, row % 5 === 0 ? '#8fe0d0' : '#2fb3a0')
    }
    rect(context, x - 1, 96 - height + 2, 1, height - 3, alpha('#cfefff', 0.45))
    rect(context, x + half - 1, 96 - height + 3, 1, height - 4, alpha('#1e6b60', 0.8))
  }
  rect(context, 114, 94, 22, 3, '#1a1224')
  rect(context, 115, 94, 20, 1, '#3a2a48')
}

function drawFicha(
  context: CanvasRenderingContext2D,
  view: BeastView,
  time: number,
  reduced: boolean,
): void {
  bevel(context, 136, 26, 82, 74, '#3f3022', '#6a5440', '#241a12', COLORS.ink)
  rect(context, 140, 30, 74, 66, '#f4ecd8')
  rect(context, 140, 30, 74, 1, '#fffbe8')
  rect(context, 166, 22, 22, 8, '#5a3a2a')
  rect(context, 170, 24, 14, 3, '#8a5a2b')
  disc(context, 143, 33, 1, '#b04a3a')

  label(context, 'BESTIARIO', 146, 41, 4, '#5c3a2a')
  rect(context, 146, 44, 62, 1, alpha('#8a7a58', 0.4))
  label(context, 'ESPECIE', 146, 51, 3, '#8a7a58')
  label(
    context,
    view.born ? view.name.toUpperCase() : '—',
    146,
    60,
    6,
    view.born ? '#3a3226' : alpha('#3a3226', 0.35),
  )
  label(context, 'VIDA', 146, 68, 3, '#8a7a58')
  for (let index = 0; index < BEAST_LIFE; index += 1) {
    drawSprite(context, SPRITES.heart, 146 + index * 9, 71, {
      scale: 1,
      palette: { r: index < view.life ? '#b04a3a' : '#d8c8b0' },
    })
  }
  label(context, `${view.life} / ${BEAST_LIFE}`, 212, 68, 3, '#6a5a44', 'right')
  label(context, 'RUGIDO', 146, 85, 3, '#8a7a58')
  label(
    context,
    view.born ? BEAST_ROAR : '—',
    146,
    94,
    5,
    view.born ? '#b04a3a' : alpha('#3a3226', 0.35),
  )
  label(context, 'HEREDA DE MONSTRUO', 212, 95, 3, alpha('#8a7a58', 0.85), 'right')

  if (view.born) {
    const stamp = reduced ? 0.8 : 0.6 + 0.2 * Math.sin(time / 480)
    context.globalAlpha = stamp
    disc(context, 199, 84, 3, '#b04a3a')
    disc(context, 194, 80, 1, '#b04a3a')
    disc(context, 199, 78, 1, '#b04a3a')
    disc(context, 204, 80, 1, '#b04a3a')
    ring(context, 199, 82, 8, alpha('#b04a3a', 0.55))
    context.globalAlpha = 1
  } else {
    ring(context, 199, 82, 8, alpha('#b04a3a', 0.28))
    ring(context, 199, 82, 4, alpha('#b04a3a', 0.18))
    rect(context, 198, 78, 2, 1, alpha('#b04a3a', 0.3))
    rect(context, 198, 86, 2, 1, alpha('#b04a3a', 0.3))
  }
}

/** Lienzo del bestiario: el dragón en su guarida y su ficha de combate. */
export function BeastScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<BeastView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawCave(context, time, reduced)
      drawDragon(context, view, time, reduced)
      drawFicha(context, view, time, reduced)

      panel(context, 4, 4, 216, 18, 'rgba(14,10,22,0.92)', '#4a3a5e')
      rect(context, 4, 4, 216, 1, alpha(COLORS.coral, 0.35))
      label(context, 'EL BESTIARIO', 12, 17, 7, '#ffb0a0')
      label(
        context,
        view.born ? 'FICHA APUNTADA' : 'SIN FICHA',
        212,
        17,
        4,
        view.born ? COLORS.lime : '#ffb648',
        'right',
      )

      panel(context, 6, 106, 212, 18, 'rgba(14,10,22,0.92)', '#4a3a5e')
      label(context, 'VIDA', 12, 114, 3, '#a08fbe')
      for (let index = 0; index < BEAST_LIFE; index += 1) {
        drawSprite(context, SPRITES.heart, 36 + index * 9, 108, {
          scale: 1,
          palette: { r: index < view.life ? COLORS.coral : '#3a2a44' },
        })
      }
      label(context, `${view.life} / ${BEAST_LIFE}`, 84, 117, 5, COLORS.cream)
      label(context, 'RUGIDO', 116, 114, 3, '#a08fbe')
      label(context, view.born ? BEAST_ROAR : '—', 116, 122, 5, view.born ? COLORS.coral : '#5a4a66')

      if (view.born) {
        panel(context, 154, 109, 64, 12, 'rgba(47,107,58,0.9)', COLORS.lime)
        drawSprite(context, SPRITES.check, 157, 111, { scale: 1, palette: { g: COLORS.cream } })
        label(context, 'COMBATE APUNTADO', 167, 117, 4, COLORS.cream)
      } else {
        label(context, 'COMBATE SIN APUNTAR', 212, 117, 4, '#6a5a78', 'right')
      }

      if (!reduced) {
        for (let index = 0; index < 5; index += 1) {
          const drift = (time / 300 + index * 9) % 44
          context.globalAlpha = 0.1 + 0.1 * rand(index + 4)
          rect(
            context,
            8 + Math.round(rand(index + 23) * 120),
            Math.round(100 - drift),
            1,
            1,
            COLORS.cream,
          )
        }
        context.globalAlpha = 1
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'beast') continue
      setView({ name: step.name, life: step.life, born: step.born })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = `El dragón ${view.name} tiene ${view.life} de ${BEAST_LIFE} de vida.${
    view.born ? ' Ha rugido y su combate está apuntado en el bestiario.' : ' Duerme en su guarida sin ficha.'
  }`

  return <PixelCanvas label={description} draw={draw} />
}
