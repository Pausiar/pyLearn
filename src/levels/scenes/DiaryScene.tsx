import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
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
  starfield,
  truncate,
} from '../../pixel/shapes'

interface DiaryView {
  lines: string[]
  counted: boolean
}

const RESTING: DiaryView = { lines: [], counted: false }
const PAGE_INK = '#3a3226'

function drawPorthole(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  const cx = 32
  const cy = 36

  disc(context, cx, cy, 22, '#241c38')
  ring(context, cx, cy, 21, '#6a5a78')
  ring(context, cx, cy, 20, '#8a80a8')
  ring(context, cx, cy, 19, '#3a2e50')

  context.save()
  context.beginPath()
  context.arc(cx, cy, 18, 0, Math.PI * 2)
  context.clip()
  gradient(context, cx - 18, cy - 18, 36, 36, '#070b1c', '#1b2a4a', 6)
  starfield(context, cx - 18, cy - 18, 36, 36, COLORS.paper, 17, 20, time, reduced)

  disc(context, cx + 8, cy - 7, 5, '#6a9ac8')
  rect(context, cx + 5, cy - 10, 4, 1, '#8fb7ff')
  rect(context, cx + 7, cy - 5, 4, 1, '#3f74a6')
  line(context, cx + 1, cy - 7, cx + 15, cy - 7, alpha(COLORS.ice, 0.65))
  line(context, cx + 2, cy - 6, cx + 4, cy - 6, alpha(COLORS.ice, 0.4))

  if (!reduced) {
    const drift = Math.round((time / 150) % 28)
    rect(context, cx - 15 + drift, cy + 11, 1, 1, alpha(COLORS.ice, 0.55))
  }

  line(context, cx - 14, cy - 5, cx - 5, cy - 14, alpha(COLORS.paper, 0.18))
  line(context, cx - 15, cy - 1, cx - 10, cy - 6, alpha(COLORS.paper, 0.1))
  context.restore()

  disc(context, cx - 14, cy - 14, 1, '#a8b0c0')
  disc(context, cx + 14, cy - 14, 1, '#a8b0c0')
  disc(context, cx - 14, cy + 14, 1, '#a8b0c0')
  disc(context, cx + 14, cy + 14, 1, '#a8b0c0')
}

function drawLamp(
  context: CanvasRenderingContext2D,
  time: number,
  reduced: boolean,
): void {
  for (let step = 0; step < 26; step += 1) {
    const half = 5 + Math.round(step * 1.35)
    context.globalAlpha = 0.028 * (1 - step / 30)
    rect(context, 32 - half, 78 + step, half * 2, 1, COLORS.gold)
  }
  context.globalAlpha = 1

  glow(context, 32, 74, 13, COLORS.gold, reduced ? 0.2 : 0.16 + 0.04 * Math.sin(time / 380))

  rect(context, 28, 66, 8, 2, '#8a5a2b')
  rect(context, 25, 68, 14, 2, '#b07a3f')
  rect(context, 22, 70, 20, 2, '#d9b878')
  rect(context, 19, 72, 26, 2, '#b07a3f')
  rect(context, 18, 74, 28, 1, '#5c3a1c')
  rect(context, 30, 75, 4, 2, '#ffe9a8')
  rect(context, 31, 77, 2, 25, '#3a2a3e')
  rect(context, 30, 77, 1, 25, '#5a4458')
  bevel(context, 22, 102, 20, 6, '#5c3a1c', '#8a5a2b', '#2a1a2e', COLORS.ink)

  rect(context, 46, 110, 8, 9, '#2a2340')
  rect(context, 45, 109, 10, 2, '#4a3a5a')
  rect(context, 48, 107, 4, 2, '#8a5a2b')
  line(context, 50, 107, 55, 98, alpha(COLORS.paper, 0.55))
  rect(context, 54, 97, 1, 2, alpha(COLORS.paper, 0.4))
}

function drawBook(
  context: CanvasRenderingContext2D,
  view: DiaryView,
  time: number,
  reduced: boolean,
): void {
  const written = view.lines.filter((entry) => entry.trim() !== '')

  rect(context, 62, 104, 164, 5, alpha(COLORS.ink, 0.35))
  bevel(context, 56, 40, 164, 66, '#4a2f4a', '#6a4a66', '#2a1a2e', COLORS.ink)
  rect(context, 61, 45, 154, 56, '#d8c8a4')
  rect(context, 63, 46, 72, 54, '#f4ecd8')
  rect(context, 140, 46, 73, 54, '#f4ecd8')
  rect(context, 207, 48, 5, 50, '#e2d2b0')
  rect(context, 208, 51, 1, 44, alpha('#8a7a58', 0.45))

  rect(context, 136, 46, 4, 54, '#e6d7b6')
  rect(context, 139, 46, 1, 54, alpha('#8a7a58', 0.45))
  rect(context, 135, 46, 1, 54, alpha('#8a7a58', 0.25))

  for (const [x, y] of [
    [56, 40],
    [208, 40],
    [56, 100],
    [208, 100],
  ]) {
    rect(context, x!, y!, 8, 2, '#d9b878')
    rect(context, x!, y!, 2, 6, '#d9b878')
  }

  rect(context, 196, 40, 6, 12, '#b04a3a')
  rect(context, 196, 51, 6, 1, '#7d2f26')
  rect(context, 197, 52, 4, 2, '#7d2f26')

  label(context, 'BITÁCORA', 71, 57, 5, '#7a5bd6')
  rect(context, 71, 60, 56, 1, alpha('#7a5bd6', 0.35))

  ring(context, 99, 72, 10, alpha(COLORS.purple, 0.55))
  disc(context, 99, 72, 6, '#4a7fd4')
  rect(context, 96, 68, 5, 1, '#8fb7ff')
  rect(context, 98, 75, 5, 1, '#2b6cb0')
  disc(context, 88, 65, 2, COLORS.ice)
  rect(context, 111, 78, 1, 1, alpha(COLORS.gold, 0.7))

  if (view.counted) {
    const stamp = reduced ? 0.85 : 0.7 + 0.15 * Math.sin(time / 500)
    context.globalAlpha = stamp
    ring(context, 99, 90, 8, COLORS.coral)
    ring(context, 99, 90, 7, alpha(COLORS.coral, 0.6))
    label(context, 'LEÍDO', 99, 92, 4, COLORS.coral, 'center')
    context.globalAlpha = 1
  } else {
    label(context, written.length === 0 ? 'sin leer' : 'leyendo…', 99, 93, 4, alpha(PAGE_INK, 0.45), 'center')
  }

  label(context, 'ENTRADAS', 146, 55, 4, '#8a7a58')
  rect(context, 146, 57, 58, 1, alpha('#8a7a58', 0.4))

  for (let index = 0; index < 3; index += 1) {
    const y = 67 + index * 14
    const entry = view.lines[index] ?? ''

    rect(context, 145, y - 7, 7, 8, alpha('#7a5bd6', 0.16))
    label(context, String(index + 1), 148, y, 4, '#7a5bd6', 'center')

    if (entry.trim() === '') {
      label(context, '· · ·', 155, y, 5, alpha(PAGE_INK, 0.3))
      for (let x = 155; x < 204; x += 5) {
        rect(context, x, y + 2, 2, 1, alpha(PAGE_INK, 0.16))
      }
    } else {
      label(context, truncate(entry, 17), 155, y, 5, PAGE_INK)
      rect(context, 155, y + 2, 50, 1, alpha(PAGE_INK, 0.18))
    }

    if (!view.counted && index === Math.min(2, written.length)) {
      const blink = reduced || Math.sin(time / 300) > -0.2
      if (blink) rect(context, 202, y - 4, 2, 4, alpha(PAGE_INK, 0.6))
    }
  }

  if (!reduced && written.length > 0 && !view.counted) {
    for (let index = 0; index < 3; index += 1) {
      const lift = (time / 240 + index * 3) % 12
      context.globalAlpha = 0.3 * (1 - lift / 12)
      rect(context, 196 + index * 4, 98 - lift, 1, 2, COLORS.violet)
    }
    context.globalAlpha = 1
  }
}

/** Lienzo del diario: la cabina, la lámpara y el libro que se escribe y se relee. */
export function DiaryScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<DiaryView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      gradient(context, 0, 0, 224, 96, '#1a1428', '#3a2e58', 8)
      dither(context, 0, 0, 224, 96, alpha(COLORS.ink, 0.14), 4)
      rect(context, 4, 0, 2, 96, alpha('#120e1e', 0.85))
      rect(context, 218, 0, 2, 96, alpha('#120e1e', 0.85))
      rect(context, 52, 0, 1, 96, alpha(COLORS.ink, 0.35))
      rect(context, 0, 88, 224, 1, alpha(COLORS.ink, 0.4))
      for (let y = 8; y < 96; y += 20) {
        rect(context, 2, y, 4, 1, '#4a3a5a')
        rect(context, 218, y, 4, 1, '#4a3a5a')
      }

      drawPorthole(context, time, reduced)

      panel(context, 56, 8, 164, 22, 'rgba(20,15,34,0.9)', '#5a3a6a')
      rect(context, 56, 8, 164, 1, alpha(COLORS.violet, 0.55))
      rect(context, 60, 12, 2, 2, alpha(COLORS.gold, 0.7))
      rect(context, 214, 12, 2, 2, alpha(COLORS.gold, 0.7))
      label(context, 'DIARIO DE A BORDO', 66, 23, 7, '#c9a7ff')
      label(
        context,
        view.counted ? 'LEÍDO' : 'diario.txt',
        212,
        22,
        4,
        view.counted ? COLORS.lime : '#a08fbe',
        'right',
      )

      gradient(context, 0, 96, 224, 32, '#3a2a3e', '#241a2c', 5)
      rect(context, 0, 96, 224, 1, '#6a4f68')
      for (let index = 0; index < 9; index += 1) {
        const x = Math.round(rand(index + 41) * 210)
        rect(context, x, 100 + Math.round(rand(index + 7) * 22), 8 + Math.round(rand(index + 19) * 12), 1, alpha('#1a1220', 0.4))
      }
      rect(context, 0, 124, 224, 4, '#1a1220')
      rect(context, 0, 124, 224, 1, '#4a3448')

      drawLamp(context, time, reduced)
      drawBook(context, view, time, reduced)

      panel(context, 56, 110, 164, 13, 'rgba(16,12,26,0.92)', '#5a3a6a')
      label(context, 'diario.txt', 62, 119, 4, '#a08fbe')
      label(
        context,
        view.counted
          ? 'LEÍDO · 3 LÍNEAS'
          : `${view.lines.filter((entry) => entry.trim() !== '').length} de 3 ESCRITAS`,
        214,
        119,
        4,
        view.counted ? COLORS.lime : COLORS.gold,
        'right',
      )

      if (!reduced) {
        for (let index = 0; index < 9; index += 1) {
          const y = 92 - ((time / 70 + index * 11) % 26)
          const x = 16 + Math.round(rand(index + 31) * 30)
          context.globalAlpha = 0.2 + 0.2 * rand(index + 61)
          rect(context, x, Math.round(y), 1, 1, COLORS.gold)
        }
        context.globalAlpha = 1
      }
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'diary') continue
      setView({ lines: step.lines, counted: step.counted })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const written = view.lines.filter((entry) => entry.trim() !== '')
  const description =
    written.length === 0
      ? 'El diario de a bordo está abierto y en blanco.'
      : `El diario tiene ${written.length} ${written.length === 1 ? 'línea' : 'líneas'}: ${written.join(
          '; ',
        )}.${view.counted ? ' El recuento marca 3 líneas.' : ''}`

  return <PixelCanvas label={description} draw={draw} />
}
