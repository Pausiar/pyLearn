import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
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
  hills,
  label,
  line,
  panel,
  rand,
  rect,
  speckle,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

const EXPECTED_ROOMS = ['sala', 'fuera', 'sala', 'fuera'] as const

interface LabView {
  readings: { room: string; value: number }[]
}

const RESTING: LabView = { readings: [] }

function lastValue(view: LabView, room: string): number | null {
  const found = [...view.readings].reverse().find((reading) => reading.room === room)
  return found ? found.value : null
}

function drawHeatLamp(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  rect(context, 75, 18, 10, 3, COLORS.steel)
  rect(context, 75, 18, 10, 1, COLORS.silver)
  line(context, 80, 21, 80, 22, COLORS.slate)
  const beat = reduced ? 1 : 0.6 + 0.4 * Math.sin(time / 500)
  context.globalAlpha = beat
  disc(context, 80, 24, 3, COLORS.gold)
  context.globalAlpha = beat * 0.22
  disc(context, 80, 24, 7, COLORS.yellow)
  context.globalAlpha = 1
  rect(context, 80, 21, 1, 1, COLORS.cream)

  for (let row = 0; row < 5; row += 1) {
    const width = 42 - row * 6
    context.globalAlpha = (0.1 - row * 0.015) * beat
    rect(context, 80 - width / 2, 83 + row, width, 1, COLORS.gold)
  }
  context.globalAlpha = 1
}

function drawWallChart(context: CanvasRenderingContext2D): void {
  panel(context, 12, 26, 26, 18, '#182636', '#3a5a6a')
  label(context, 'T°', 16, 33, 5, '#8fd3a6')
  line(context, 15, 40, 21, 37, COLORS.teal)
  line(context, 21, 37, 27, 39, COLORS.teal)
  line(context, 27, 39, 33, 33, COLORS.teal)
  rect(context, 14, 41, 21, 1, alpha(COLORS.teal, 0.35))

  rect(context, 12, 52, 26, 2, COLORS.woodLight)
  rect(context, 12, 54, 26, 1, COLORS.woodDark)
  rect(context, 15, 47, 5, 5, '#6aa6a0')
  rect(context, 15, 47, 5, 1, COLORS.ice)
  rect(context, 23, 48, 4, 4, '#c96a4a')
  rect(context, 23, 48, 4, 1, COLORS.cream)
  rect(context, 30, 46, 5, 6, '#8a5aa8')
  rect(context, 30, 46, 5, 1, COLORS.violet)
}

function drawThermometer(
  context: CanvasRenderingContext2D,
  x: number,
  value: number | null,
  accent: string,
): void {
  rect(context, x, 28, 6, 48, COLORS.silver)
  rect(context, x + 1, 29, 4, 44, '#0e1622')
  rect(context, x + 1, 29, 1, 44, alpha(COLORS.ink, 0.5))
  for (let y = 32; y < 70; y += 6) rect(context, x - 2, y, 2, 1, COLORS.silver)
  label(context, '°C', x + 8, 34, 5, '#9aa8c2')

  const fill = value === null ? 3 : Math.round(((value - 16) / 24) * 38) + 4
  rect(context, x + 2, 72 - fill, 2, fill, accent)
  rect(context, x + 2, 72 - fill, 1, 1, COLORS.cream)
  disc(context, x + 3, 77, 4, COLORS.silver)
  disc(context, x + 3, 77, 3, accent)
  rect(context, x + 2, 75, 1, 1, COLORS.cream)
}

function drawSala(
  context: CanvasRenderingContext2D,
  view: LabView,
  time: number,
  reduced: boolean,
): void {
  const sala = lastValue(view, 'sala')

  panel(context, 6, 6, 104, 88, '#141d2c', '#3a4a6a')
  rect(context, 6, 6, 104, 12, '#1d3a30')
  rect(context, 6, 6, 104, 1, '#2f6b52')
  label(context, 'SALA (DENTRO)', 12, 15, 6, '#8fd3a6')
  label(context, sala === null ? '—' : String(sala), 103, 15, 9, '#8fd3a6', 'right')

  rect(context, 8, 18, 100, 74, '#1a2436')
  gradient(context, 8, 18, 100, 64, '#26334a', '#18212f', 6)
  for (let y = 30; y < 82; y += 12) {
    rect(context, 8, y, 100, 1, alpha(COLORS.ink, 0.28))
    rect(context, 8, y + 1, 100, 1, alpha(COLORS.paper, 0.04))
  }
  dither(context, 8, 18, 100, 64, alpha(COLORS.ink, 0.12), 3)
  drawWallChart(context)

  rect(context, 8, 82, 100, 10, '#39445e')
  for (let column = 0; column < 10; column += 1) {
    if (column % 2 === 0) rect(context, 8 + column * 10, 83, 10, 9, '#3f4c68')
  }
  rect(context, 8, 82, 100, 1, '#5f6c8c')
  rect(context, 8, 91, 100, 1, '#232b3f')

  drawHeatLamp(context, time, reduced)

  rect(context, 14, 70, 32, 3, '#8a5a2b')
  rect(context, 14, 70, 32, 1, '#b07a3f')
  rect(context, 16, 73, 2, 9, '#5c3a1c')
  rect(context, 42, 73, 2, 9, '#5c3a1c')
  drawSprite(context, SPRITES.potion, 20, 60, { scale: 1, outline: COLORS.ink })
  rect(context, 33, 63, 3, 7, '#6aa6a0')
  rect(context, 33, 63, 3, 1, COLORS.ice)
  rect(context, 33, 66, 3, 1, alpha(COLORS.paper, 0.4))
  rect(context, 36, 64, 8, 2, '#c96a4a')
  rect(context, 37, 66, 8, 2, COLORS.blue)
  rect(context, 38, 68, 7, 2, COLORS.forest)

  drawSprite(context, SPRITES.scientist, 52, 50, { scale: 2, outline: COLORS.ink })

  drawThermometer(context, 93, sala, COLORS.coral)
}

function drawFuera(
  context: CanvasRenderingContext2D,
  view: LabView,
  time: number,
  reduced: boolean,
): void {
  const fuera = lastValue(view, 'fuera')

  panel(context, 118, 6, 100, 88, '#141d2c', '#5a4a78')
  rect(context, 118, 6, 100, 12, '#2a2440')
  rect(context, 118, 6, 100, 1, '#5a4a78')
  label(context, 'FUERA (GLOBAL)', 124, 15, 6, '#a99cc4')
  label(context, fuera === null ? '—' : String(fuera), 213, 15, 9, COLORS.sky, 'right')

  rect(context, 121, 19, 94, 72, '#2a2230')
  rect(context, 121, 19, 94, 1, '#4a3a58')
  rect(context, 121, 90, 94, 1, '#1a1626')

  context.save()
  context.beginPath()
  context.rect(123, 21, 90, 68)
  context.clip()

  gradient(context, 123, 21, 90, 62, '#3a2b5e', '#d98a5a', 8)
  starfield(context, 123, 21, 90, 24, '#f5e9d0', 77, 12, time, reduced)
  glow(context, 160, 46, 18, COLORS.gold, 0.22)
  disc(context, 160, 46, 8, COLORS.gold)
  disc(context, 160, 46, 6, '#f6c85a')
  disc(context, 158, 44, 2, COLORS.cream)
  cloud(context, 130, 29, 24, '#6a5488', '#4a3a68')
  cloud(context, 184, 24, 20, '#8a5a78', '#5a4468')

  hills(context, 78, 12, '#4a3a68', 9)
  hills(context, 80, 8, '#3a2b52', 27)
  rect(context, 123, 78, 90, 11, '#2b2438')
  speckle(context, 123, 79, 90, 9, '#3a3350', 31, 20)
  drawSprite(context, SPRITES.tree, 130, 58, {
    scale: 1,
    palette: { f: '#2b2438', g: '#3a3350', u: '#2b2438', n: '#1a1626' },
  })
  drawSprite(context, SPRITES.bush, 181, 70, {
    scale: 1,
    palette: { g: '#2b2438', f: '#3a3350' },
  })
  line(context, 140, 36, 143, 33, '#1a1626')
  line(context, 143, 33, 146, 36, '#1a1626')
  line(context, 149, 32, 152, 29, '#1a1626')
  line(context, 152, 29, 155, 32, '#1a1626')

  line(context, 126, 74, 148, 30, alpha(COLORS.paper, 0.06))
  line(context, 134, 84, 158, 36, alpha(COLORS.paper, 0.04))

  context.restore()

  drawThermometer(context, 200, fuera, COLORS.sky)
}

function drawNotebook(
  context: CanvasRenderingContext2D,
  view: LabView,
  time: number,
  reduced: boolean,
): void {
  const done = view.readings.length === EXPECTED_ROOMS.length

  rect(context, 8, 97, 212, 27, alpha(COLORS.ink, 0.45))
  rect(context, 6, 96, 212, 27, '#e8dcc0')
  rect(context, 6, 96, 212, 1, '#f6ecd6')
  rect(context, 6, 122, 212, 1, '#b7a888')
  speckle(context, 6, 98, 212, 24, '#c8b492', 43, 26)

  for (let index = 0; index < 8; index += 1) {
    rect(context, 12 + index * 26, 96, 2, 2, '#8a7a5c')
    rect(context, 12 + index * 26, 97, 1, 1, '#241a20')
  }

  EXPECTED_ROOMS.forEach((room, index) => {
    const reading = view.readings[index]
    const isLast = index === view.readings.length - 1
    const accent = room === 'sala' ? COLORS.green : COLORS.sky
    const x = 10 + index * 38

    rect(
      context,
      x,
      100,
      36,
      20,
      reading ? alpha(accent, 0.16) : alpha(COLORS.paper, 0.35),
    )
    const border = isLast ? accent : reading ? '#a8946c' : '#c0ae88'
    rect(context, x, 100, 36, 1, border)
    rect(context, x, 119, 36, 1, border)
    rect(context, x, 100, 1, 20, border)
    rect(context, x + 35, 100, 1, 20, border)
    if (isLast && !reduced) {
      context.globalAlpha = 0.3 + 0.2 * Math.sin(time / 320)
      rect(context, x - 1, 99, 38, 1, accent)
      rect(context, x - 1, 120, 38, 1, accent)
      context.globalAlpha = 1
    }

    label(
      context,
      room.toUpperCase(),
      x + 18,
      107,
      5,
      reading ? accent : '#9a8a70',
      'center',
    )
    label(
      context,
      reading ? String(reading.value) : '—',
      x + 18,
      117,
      9,
      reading ? '#241a20' : '#b7a888',
      'center',
    )
  })

  if (done) {
    const pulse = reduced ? 1 : 0.82 + 0.18 * Math.sin(time / 320)
    context.globalAlpha = pulse
    panel(context, 168, 100, 44, 20, 'rgba(47,107,58,0.92)', COLORS.green)
    drawSprite(context, SPRITES.check, 172, 102, {
      scale: 1,
      palette: { g: COLORS.lime },
    })
    label(context, 'COMPLETO', 193, 110, 6, COLORS.cream, 'center')
    label(context, '4 LECTURAS', 193, 117, 5, COLORS.lime, 'center')
    context.globalAlpha = 1
    for (let index = 0; index < 5; index += 1) {
      const progress = reduced ? 0.5 : (time / 1500 + index / 5) % 1
      rect(
        context,
        Math.round(168 + rand(index + 9) * 44),
        Math.round(99 - progress * 12),
        1,
        1,
        COLORS.gold,
      )
    }
  } else {
    label(context, 'LECTURAS', 190, 105, 5, '#8a7a5c', 'center')
    for (let index = 0; index < EXPECTED_ROOMS.length; index += 1) {
      const x = 172 + index * 10
      const filled = index < view.readings.length
      const accent = EXPECTED_ROOMS[index] === 'sala' ? COLORS.green : COLORS.sky
      rect(context, x, 108, 8, 6, filled ? accent : '#d8c8a4')
      rect(context, x, 108, 8, 1, filled ? accent : '#b7a888')
      rect(context, x, 113, 8, 1, filled ? accent : '#b7a888')
      rect(context, x, 108, 1, 6, filled ? accent : '#b7a888')
      rect(context, x + 7, 108, 1, 6, filled ? accent : '#b7a888')
    }
    label(context, `${view.readings.length}/4`, 190, 120, 7, '#5c4a38', 'center')
  }
}

function drawLab(
  context: CanvasRenderingContext2D,
  view: LabView,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 128, '#161c2a', '#22283a', 6)
  dither(context, 0, 0, 224, 128, alpha(COLORS.ink, 0.1), 3)

  drawSala(context, view, time, reduced)
  drawFuera(context, view, time, reduced)

  rect(context, 112, 6, 4, 88, '#0f1622')
  rect(context, 113, 6, 2, 88, '#2b3346')
  rect(context, 113, 6, 1, 88, '#46527a')
  rect(context, 111, 40, 6, 3, COLORS.steel)
  rect(context, 111, 40, 6, 1, COLORS.silver)

  drawNotebook(context, view, time, reduced)
}

/** Lienzo del laboratorio: la sala de dentro, la calle de fuera y el cuaderno. */
export function LabScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<LabView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawLab(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'lab') continue
      setView({ readings: step.readings })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 340)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.readings.length === 0
      ? 'El cuaderno del laboratorio está vacío: sala y calle esperan su primera lectura.'
      : `El cuaderno anota: ${view.readings
          .map((reading) => `${reading.room} ${reading.value}`)
          .join(', ')}.${view.readings.length === EXPECTED_ROOMS.length ? ' Cuaderno completo.' : ''}`

  return <PixelCanvas label={description} draw={draw} />
}
