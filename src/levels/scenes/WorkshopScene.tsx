import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { WORKSHOP_NAME, WORKSHOP_PIECES } from '../../engine/workshop'
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
  groundTexture,
  label,
  line,
  mix,
  panel,
  rand,
  rect,
  ring,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface WorkshopView {
  name: string
  pieces: string[]
  ready: boolean | null
}

const RESTING: WorkshopView = { name: WORKSHOP_NAME, pieces: [], ready: null }

function drawGear(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  teeth: number,
  body: string,
  rim: string,
  time: number,
  reduced: boolean,
): void {
  const spin = reduced ? 0 : time / 2600
  for (let index = 0; index < teeth; index += 1) {
    const angle = spin + (index / teeth) * Math.PI * 2
    rect(
      context,
      cx + Math.cos(angle) * (radius + 1) - 2,
      cy + Math.sin(angle) * (radius + 1) - 2,
      4,
      4,
      body,
    )
  }
  disc(context, cx, cy, radius, rim)
  disc(context, cx, cy, radius - 2, body)
  ring(context, cx, cy, radius - 5, alpha(rim, 0.45))
  disc(context, cx, cy, 3, rim)
  disc(context, cx, cy, 1, body)
}

function drawWheelSlot(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  mounted: boolean,
  time: number,
  reduced: boolean,
): void {
  rect(context, cx - 3, 84, 6, 4, '#3f4a52')
  rect(context, cx - 3, 84, 6, 1, '#6a7a82')

  if (!mounted) {
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2
      rect(
        context,
        cx + Math.cos(angle) * 8 - 1,
        cy + Math.sin(angle) * 8 - 1,
        2,
        2,
        alpha('#8fb0b4', 0.7),
      )
    }
    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2 + 0.4
      rect(context, cx + Math.cos(angle) * 4, cy + Math.sin(angle) * 4, 1, 1, alpha('#8fb0b4', 0.5))
    }
    ring(context, cx, cy, 4, alpha('#8fb0b4', 0.28))
    label(context, '?', cx, cy + 2, 6, alpha('#dfeaec', 0.75), 'center')
    return
  }

  disc(context, cx, cy, 9, '#0e1418')
  disc(context, cx, cy, 7, '#3f4a52')
  disc(context, cx, cy, 4, '#5a6a72')
  const spin = reduced ? 0.8 : time / 90
  for (let index = 0; index < 4; index += 1) {
    const angle = spin + (index / 4) * Math.PI * 2
    rect(context, cx + Math.cos(angle) * 4.5 - 1, cy + Math.sin(angle) * 4.5 - 1, 2, 2, '#a8b0c0')
  }
  disc(context, cx, cy, 1, '#ffc857')
  rect(context, cx - 6, cy - 7, 4, 1, alpha(COLORS.paper, 0.35))
}

function drawAntenna(
  context: CanvasRenderingContext2D,
  mounted: boolean,
  ready: boolean,
  time: number,
  reduced: boolean,
): void {
  if (!mounted) {
    for (let y = 29; y < 35; y += 3) {
      rect(context, 66, y, 1, 1, alpha('#8fb0b4', 0.45))
    }
    ring(context, 66, 29, 3, alpha('#8fb0b4', 0.4))
    return
  }

  rect(context, 65, 31, 2, 4, '#a8b0c0')
  rect(context, 65, 31, 1, 4, '#d8e2ee')
  const pulse = reduced ? 0.7 : 0.55 + 0.25 * Math.sin(time / 320)
  if (ready) {
    glow(context, 66, 29, 8, COLORS.coral, 0.35)
  }
  disc(context, 66, 29, 3, '#e05263')
  rect(context, 65, 28, 1, 1, '#ff9e7a')
  context.globalAlpha = pulse * 0.8
  rect(context, 60, 25, 1, 1, COLORS.coral)
  rect(context, 71, 25, 1, 1, COLORS.coral)
  rect(context, 58, 29, 1, 1, COLORS.coral)
  rect(context, 73, 29, 1, 1, COLORS.coral)
  context.globalAlpha = 1
}

function drawRobot(
  context: CanvasRenderingContext2D,
  view: WorkshopView,
  time: number,
  reduced: boolean,
): void {
  const ready = view.ready === true
  const has = (piece: string) => view.pieces.includes(piece)
  const bob = reduced ? 0 : Math.sin(time / 900) > 0.7 ? -1 : 0
  const blink = !reduced && Math.sin(time / 720) > 0.965

  bevel(context, 34, 96, 68, 9, '#3f4a52', '#6a7a82', '#232a30', COLORS.ink)
  for (let x = 37; x < 99; x += 8) {
    rect(context, x, 97, 4, 1, x % 16 === 5 ? COLORS.gold : alpha(COLORS.ink, 0.55))
  }
  label(context, (view.name || 'ROBOT').toUpperCase(), 68, 104, 4, '#cfe0e4', 'center')

  const top = 58 + bob

  rect(context, 44, top + 4, 6, 10, '#6a7688')
  rect(context, 86, top + 4, 6, 10, '#6a7688')
  rect(context, 40, top + 10, 6, 18, '#7a8698')
  rect(context, 92, top + 10, 6, 18, '#7a8698')
  rect(context, 40, top + 10, 1, 18, '#9aa8bc')
  rect(context, 97, top + 10, 1, 18, '#5a6678')
  rect(context, 38, top + 28, 4, 4, '#5a6678')
  rect(context, 42, top + 30, 3, 4, '#5a6678')
  rect(context, 46, top + 28, 3, 3, '#5a6678')
  rect(context, 93, top + 28, 4, 4, '#5a6678')
  rect(context, 90, top + 30, 3, 4, '#5a6678')
  rect(context, 87, top + 28, 3, 3, '#5a6678')

  bevel(context, 48, top, 40, 28, '#8a98ac', '#b8c4d4', '#5a6678', COLORS.ink)
  rect(context, 50, top + 2, 1, 24, alpha(COLORS.paper, 0.18))

  bevel(context, 56, top + 6, 24, 16, '#1a2a30', '#2f5a54', '#0e1a1e', COLORS.ink)
  if (ready) {
    glow(context, 68, top + 14, 10, COLORS.gold, 0.3)
  }
  disc(context, 68, top + 14, 4, ready ? COLORS.gold : '#3f5a54')
  disc(context, 67, top + 13, 2, ready ? '#fff3c4' : '#5a7a80')
  ring(context, 68, top + 14, 6, alpha('#8fb0b4', 0.4))
  for (let index = 0; index < 3; index += 1) {
    rect(context, 58 + index * 8, top + 24, 5, 2, index < view.pieces.length ? COLORS.moss : '#1a2a30')
  }
  for (const [x, y] of [
    [51, top + 3],
    [85, top + 3],
    [51, top + 25],
    [85, top + 25],
  ]) {
    disc(context, x!, y!, 1, '#6a7688')
  }

  drawWheelSlot(context, 56, 92, has('rueda'), time, reduced)
  drawWheelSlot(context, 80, 92, has('rueda'), time, reduced)

  const head = top - 24
  bevel(context, 48, head, 40, 24, '#aab6c8', '#d8e2ee', '#6a7688', COLORS.ink)
  rect(context, 50, head + 2, 1, 20, alpha(COLORS.paper, 0.25))
  disc(context, 46, head + 10, 3, '#6a7688')
  disc(context, 90, head + 10, 3, '#6a7688')
  disc(context, 46, head + 9, 1, '#aab6c8')
  disc(context, 90, head + 9, 1, '#aab6c8')
  rect(context, 54, head + 6, 28, 12, '#0e1a20')
  rect(context, 54, head + 6, 28, 1, '#26363c')

  if (ready) {
    glow(context, 68, head + 11, 9, COLORS.lime, 0.18)
  }
  if (blink) {
    rect(context, 58, head + 12, 4, 1, ready ? COLORS.lime : '#2fb3a0')
    rect(context, 72, head + 12, 4, 1, ready ? COLORS.lime : '#2fb3a0')
  } else {
    rect(context, 58, head + 10, 4, 3, ready ? COLORS.lime : '#2fb3a0')
    rect(context, 72, head + 10, 4, 3, ready ? COLORS.lime : '#2fb3a0')
    rect(context, 59, head + 10, 2, 1, '#eafff4')
    rect(context, 73, head + 10, 2, 1, '#eafff4')
  }
  rect(context, 63, head + 15, 10, 1, ready ? COLORS.moss : '#3f5a5e')
  if (ready) {
    rect(context, 62, head + 14, 2, 1, COLORS.moss)
    rect(context, 72, head + 14, 2, 1, COLORS.moss)
  }
  disc(context, 51, head + 3, 1, '#6a7688')
  disc(context, 85, head + 3, 1, '#6a7688')

  drawAntenna(context, has('antena'), ready, time, reduced)

  if (ready && !reduced) {
    for (let index = 0; index < 3; index += 1) {
      const lift = (time / 520 + index * 0.34) % 1
      context.globalAlpha = 0.5 * (1 - lift)
      rect(context, 98 + index * 3, top + 8 - Math.round(lift * 12), 1, 1, COLORS.lime)
      context.globalAlpha = 1
    }
  }
}

function drawSparks(
  context: CanvasRenderingContext2D,
  view: WorkshopView,
  time: number,
  reduced: boolean,
): void {
  if (reduced || view.pieces.length === 0) return
  const latest = view.pieces[view.pieces.length - 1]
  const centres: [number, number][] =
    latest === 'rueda'
      ? [
          [56, 96],
          [80, 96],
        ]
      : [
          [66, 29],
          [66, 34],
        ]

  for (const [cx, cy] of centres) {
    for (let index = 0; index < 5; index += 1) {
      const cycle = (time / 95 + index * 13) % 22
      if (cycle > 5) continue
      const angle = rand(index + cx) * Math.PI * 2
      const length = 2 + Math.round(rand(index + cy + 3) * 4)
      const reach = 5 + cycle * 1.2
      context.globalAlpha = 0.85 * (1 - cycle / 5)
      line(
        context,
        cx + Math.cos(angle) * reach,
        cy + Math.sin(angle) * reach,
        cx + Math.cos(angle) * (reach + length),
        cy + Math.sin(angle) * (reach + length),
        index % 2 === 0 ? COLORS.gold : '#fff3c4',
      )
      context.globalAlpha = 1
    }
  }
}

function drawPieceRow(
  context: CanvasRenderingContext2D,
  piece: string,
  index: number,
  mounted: boolean,
): void {
  const y = 42 + index * 17
  rect(context, 140, y, 72, 14, mounted ? '#15342a' : '#12222a')
  rect(context, 140, y, 72, 1, mounted ? alpha(COLORS.moss, 0.35) : alpha('#5a7a80', 0.25))
  context.strokeStyle = mounted ? alpha(COLORS.moss, 0.45) : alpha('#5a7a80', 0.25)
  context.lineWidth = 1
  context.strokeRect(140.5, y + 0.5, 71, 13)

  if (piece === 'rueda') {
    disc(context, 147, y + 7, 5, '#0e1418')
    disc(context, 147, y + 7, 4, mounted ? '#8a9098' : '#44545c')
    disc(context, 147, y + 7, 2, mounted ? '#ffc857' : '#2a3438')
  } else {
    rect(context, 146, y + 4, 2, 8, mounted ? '#a8b0c0' : '#44545c')
    disc(context, 147, y + 3, 3, mounted ? '#e05263' : '#44545c')
    rect(context, 151, y + 2, 1, 1, mounted ? COLORS.coral : alpha('#8fb0b4', 0.4))
  }

  label(
    context,
    piece.toUpperCase(),
    158,
    y + 10,
    5,
    mounted ? COLORS.cream : '#6a8a90',
  )

  if (mounted) {
    drawSprite(context, SPRITES.check, 203, y + 4, { scale: 1, palette: { g: COLORS.lime } })
  } else {
    label(context, '—', 210, y + 10, 4, alpha('#8fb0b4', 0.6), 'right')
  }
}

/** Lienzo del taller: Bruno sobre la plataforma, sus piezas y el parte final. */
export function WorkshopScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<WorkshopView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      gradient(context, 0, 0, 224, 106, '#0c1a20', '#1e3a40', 8)
      dither(context, 0, 0, 224, 106, alpha(COLORS.ink, 0.1), 4)

      for (let x = 0; x < 224; x += 28) {
        rect(context, x, 24, 1, 72, alpha(COLORS.ink, 0.25))
        rect(context, x + 1, 24, 1, 72, alpha('#5a7470', 0.12))
      }
      for (const y of [32, 60, 88]) {
        rect(context, 0, y, 224, 1, alpha('#5a7470', 0.2))
        rect(context, 0, y + 1, 224, 1, alpha(COLORS.ink, 0.3))
      }
      for (const y of [33, 61, 89]) {
        for (let x = 6; x < 224; x += 28) {
          disc(context, x, y, 1, alpha('#8fb0b4', 0.25))
        }
      }

      rect(context, 0, 24, 224, 2, '#39464c')
      rect(context, 0, 24, 224, 1, '#5a6a70')
      for (const x of [12, 64, 116, 168]) {
        rect(context, x, 23, 4, 4, '#5a6a70')
        rect(context, x, 27, 2, 1, alpha(COLORS.ink, 0.5))
      }

      drawGear(context, 24, 60, 18, 10, '#18282e', '#2a4048', time, reduced)
      drawGear(context, 43, 36, 10, 8, '#16242a', '#243a40', -time, reduced)

      line(context, 112, 25, 112, 29, '#2a3438')
      rect(context, 104, 29, 16, 2, '#26343a')
      rect(context, 107, 31, 10, 3, '#3f4a52')
      rect(context, 109, 34, 6, 1, '#ffe08a')
      const lamp = reduced ? 0.1 : 0.08 + 0.04 * Math.sin(time / 480)
      context.globalAlpha = lamp
      for (let row = 0; row < 16; row += 1) {
        const spread = 4 + row * 2
        rect(context, 112 - spread, 35 + row, spread * 2, 1, COLORS.gold)
      }
      context.globalAlpha = 1

      groundTexture(context, 0, 96, 224, 32, '#243238', '#3f4a52', '#141c20', 9)

      drawRobot(context, view, time, reduced)
      drawSparks(context, view, time, reduced)

      panel(context, 136, 26, 82, 52, 'rgba(8,22,24,0.92)', '#2f5a54')
      rect(context, 136, 26, 82, 1, alpha(COLORS.teal, 0.4))
      label(context, 'PIEZAS', 142, 37, 5, '#8fe0d0')
      label(context, `${view.pieces.length}/2`, 212, 37, 5, COLORS.gold, 'right')
      WORKSHOP_PIECES.forEach((piece, index) => {
        drawPieceRow(context, piece, index, view.pieces.includes(piece))
      })

      panel(context, 136, 82, 82, 22, 'rgba(8,22,24,0.92)', '#2f5a54')
      const ready = view.ready === true
      const pending = view.ready === false
      const lampColour = ready ? COLORS.lime : pending ? COLORS.coral : COLORS.gold
      const lampText = ready ? 'ROBOT LISTO' : pending ? 'FALTAN PIEZAS' : 'SIN REVISAR'
      if (ready) {
        glow(context, 146, 94, 9, COLORS.lime, 0.3)
      }
      disc(context, 146, 94, 5, '#0e1a1e')
      disc(context, 146, 94, 4, lampColour)
      disc(context, 145, 93, 2, mix(COLORS.paper, lampColour, 0.35))
      label(context, lampText, 156, 93, 5, lampColour)
      label(context, ready ? 'ENTREGADO AL JEFE' : 'PARTE PENDIENTE', 156, 101, 3, '#6a8a90')

      panel(context, 6, 106, 212, 18, 'rgba(8,22,24,0.92)', '#2f5a54')
      label(context, view.name.toUpperCase(), 12, 115, 5, COLORS.cream)
      label(context, 'MONTAJE', 12, 122, 3, '#6a8a90')
      label(context, 'PIEZAS', 92, 114, 3, '#6a8a90')
      for (let index = 0; index < 2; index += 1) {
        rect(context, 92 + index * 9, 117, 6, 6, index < view.pieces.length ? COLORS.gold : '#22383a')
        rect(context, 92 + index * 9, 117, 6, 1, alpha(COLORS.paper, index < view.pieces.length ? 0.35 : 0.08))
      }
      label(context, `${view.pieces.length} / 2`, 118, 122, 5, COLORS.cream)

      if (ready) {
        panel(context, 150, 109, 68, 12, 'rgba(47,107,58,0.9)', COLORS.lime)
        drawSprite(context, SPRITES.check, 153, 111, { scale: 1, palette: { g: COLORS.cream } })
        label(context, 'ROBOT ENTREGADO', 163, 117, 4, COLORS.cream)
      } else {
        label(context, 'EN EL TALLER', 212, 117, 4, '#6a8a90', 'right')
      }

      if (!reduced) {
        for (let index = 0; index < 5; index += 1) {
          const x = 12 + Math.round(rand(index + 61) * 190)
          const y = 80 - ((time / 240 + index * 7) % 50)
          context.globalAlpha = 0.1 + 0.12 * rand(index + 5)
          rect(context, x, Math.round(y), 1, 1, COLORS.cream)
        }
        context.globalAlpha = 1
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'workshop') continue
      setView({ name: step.name, pieces: step.pieces, ready: step.ready })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.pieces.length === 0
      ? `El taller espera: el robot ${view.name} está sin montar.`
      : `El robot ${view.name} lleva ${view.pieces.join(' y ')}. ${
          view.ready === true
            ? 'Está listo y entregado.'
            : view.ready === false
              ? 'Todavía no está listo.'
              : 'Falta el parte final.'
        }`

  return <PixelCanvas label={description} draw={draw} />
}
