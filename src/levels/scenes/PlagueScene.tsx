import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  disc,
  dither,
  gradient,
  label,
  line,
  mix,
  panel,
  rand,
  rect,
  truncate,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface PlagueView {
  lines: { text: string; ok: boolean }[]
}

const RESTING: PlagueView = { lines: [] }

const ZONES = ['almacén', 'cocina', 'pasillo', 'azotea']
const PLACEHOLDER = { text: '(sin línea)', ok: false }

function drawBug(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  colour: string,
  phase: number,
  scale = 1,
): void {
  const s = scale
  const sway = Math.round(Math.sin(phase) * s)
  const dark = mix(colour, COLORS.ink, 0.4)

  rect(context, x + 2 * s + sway, y, s, s, colour)
  rect(context, x + 4 * s + sway, y, s, s, colour)
  rect(context, x + s, y + s, 5 * s, s, colour)
  rect(context, x, y + 2 * s, 7 * s, s, colour)
  rect(context, x + 2 * s, y + 2 * s, s, s, mix(colour, COLORS.paper, 0.45))
  rect(context, x + s, y + 3 * s, 5 * s, s, colour)
  rect(context, x, y + 4 * s, s, s, dark)
  rect(context, x + 6 * s, y + 4 * s, s, s, dark)
}

function reportedBugs(lines: { text: string }[]): number | null {
  const entry = lines.find((candidate) => candidate.text.startsWith('Bichos'))
  const match = entry?.text.match(/\d+/)
  return match ? Math.max(0, Math.min(12, Number(match[0]))) : null
}

function drawZones(
  context: CanvasRenderingContext2D,
  rows: { text: string; ok: boolean }[],
  time: number,
  reduced: boolean,
): void {
  const zonesOk = rows[0]?.ok === true

  panel(context, 6, 26, 60, 68, 'rgba(8,20,16,0.86)', '#2f5a4a')
  label(context, 'ZONAS', 12, 37, 5, COLORS.lime)
  label(context, zonesOk ? '4' : '?', 60, 37, 5, zonesOk ? COLORS.lime : '#b8a23a', 'right')
  rect(context, 12, 39, 48, 1, alpha(COLORS.lime, 0.25))

  ZONES.forEach((name, index) => {
    const y = 42 + index * 14
    rect(context, 10, y, 11, 2, zonesOk ? '#4aa86a' : '#5a4a3a')
    rect(context, 10, y + 2, 11, 7, alpha(COLORS.ice, 0.13))
    rect(context, 10, y + 2, 11, 1, alpha(COLORS.ice, 0.28))
    rect(context, 18, y + 3, 2, 6, alpha(COLORS.paper, 0.06))

    context.globalAlpha = zonesOk ? 1 : 0.45
    drawBug(context, 12, y + 3, COLORS.coral, time / 240 + index * 1.7)
    context.globalAlpha = 1

    label(context, name, 25, y + 8, 4, zonesOk ? '#d7e4df' : '#8fbcb4')
    if (zonesOk) {
      drawSprite(context, SPRITES.check, 55, y + 1, { scale: 1, palette: { g: COLORS.lime } })
    } else {
      label(context, '?', 61, y + 8, 4, '#b8a23a', 'right')
    }

    if (!reduced) {
      const rise = (time / 300 + index * 0.8) % 1
      context.globalAlpha = 0.4 * (1 - rise)
      rect(context, 16 + index, y + 8 - Math.round(rise * 6), 1, 1, COLORS.ice)
      context.globalAlpha = 1
    }
  })
}

function drawMonitor(
  context: CanvasRenderingContext2D,
  rows: { text: string; ok: boolean }[],
  time: number,
  reduced: boolean,
): void {
  bevel(context, 70, 26, 90, 70, '#15241f', '#3a5a4a', '#0a1410', COLORS.ink)
  rect(context, 74, 30, 82, 44, '#081410')
  rect(context, 74, 30, 82, 1, '#0a2018')

  rows.forEach((row, index) => {
    const y = 32 + index * 15
    rect(context, 76, y, 78, 12, row.ok ? '#143b2b' : '#3a1c20')
    rect(context, 76, y, 2, 12, row.ok ? COLORS.moss : COLORS.coral)
    rect(context, 76, y, 78, 1, alpha(COLORS.paper, 0.04))
    label(context, String(index + 1), 80, y + 9, 4, row.ok ? '#8fd3a6' : '#e7777b')
    label(
      context,
      truncate(row.text, 19),
      87,
      y + 9,
      5,
      row.ok ? '#d9ffe6' : '#ffd9da',
    )
    if (row.ok) {
      drawSprite(context, SPRITES.check, 147, y + 2, { scale: 1, palette: { g: COLORS.lime } })
    } else {
      drawBug(context, 147, y + 4, COLORS.coral, time / 210 + index)
    }
  })

  if (!reduced) {
    const scan = 32 + Math.round((time / 26) % 42)
    context.globalAlpha = 0.12
    rect(context, 76, Math.min(scan, 70), 78, 1, COLORS.cyan)
    context.globalAlpha = 1
  }

  rect(context, 74, 76, 82, 16, '#0d1a16')
  rect(context, 74, 76, 82, 1, '#1b322a')
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      rect(context, 78 + column * 8, 79 + row * 4, 6, 3, (row + column) % 4 === 0 ? '#224036' : '#172a23')
    }
  }
  for (let index = 0; index < 3; index += 1) {
    const ok = rows[index]?.ok === true
    disc(context, 148 + index * 4, 89, 1, ok ? COLORS.lime : '#3a2a2a')
  }
  rect(context, 143, 78, 12, 7, '#3a1c20')
  rect(context, 143, 78, 12, 1, '#5a2a2e')
  label(context, 'ESC', 149, 83, 3, '#e7777b', 'center')
}

function drawTerrarium(
  context: CanvasRenderingContext2D,
  rows: { text: string; ok: boolean }[],
  time: number,
  reduced: boolean,
): void {
  bevel(context, 164, 26, 54, 70, '#15241f', '#3a5a4a', '#0a1410', COLORS.ink)
  label(context, 'BICHOS', 170, 37, 5, COLORS.coral)
  const count = reportedBugs(rows)
  label(context, count === null ? '—' : String(count), 212, 40, 9, count !== null && count > 6 ? COLORS.coral : COLORS.gold, 'right')
  rect(context, 170, 42, 42, 1, alpha(COLORS.coral, 0.3))

  rect(context, 168, 45, 46, 35, '#081410')
  rect(context, 168, 45, 46, 1, '#1b322a')
  rect(context, 211, 46, 1, 33, alpha(COLORS.paper, 0.08))
  line(context, 170, 47, 202, 78, alpha(COLORS.ice, 0.06))

  if (count === 0) {
    label(context, 'SIN BICHOS', 191, 65, 4, '#4a6a60', 'center')
  } else {
    const shown = Math.min(8, count ?? 0)
    for (let index = 0; index < shown; index += 1) {
      const column = index % 4
      const row = Math.floor(index / 4)
      const x = 171 + column * 11 + Math.round((rand(index + 5) - 0.5) * 2)
      const y = 50 + row * 15 + Math.round((rand(index + 23) - 0.5) * 2)
      drawBug(context, x, y, index % 3 === 0 ? '#ff9e7a' : COLORS.coral, (reduced ? 0 : time / 190) + index * 2.3)
    }
  }
  label(context, 'EN LA TRAMPA', 170, 78, 4, '#6a8a80')

  rect(context, 168, 84, 46, 1, alpha(COLORS.teal, 0.25))
  const alarmLine = rows[2]
  const active = alarmLine?.ok === true
  const controlled = /controlada/i.test(alarmLine?.text ?? '')

  if (active) {
    const pulse = reduced ? 0.3 : 0.22 + 0.18 * Math.sin(time / 260)
    context.globalAlpha = pulse
    disc(context, 171, 89, 5, COLORS.coral)
    context.globalAlpha = 1
    disc(context, 171, 89, 2, COLORS.coral)
    label(context, 'PLAGA ACTIVA', 194, 92, 4, '#ffd9da', 'center')
  } else {
    disc(context, 171, 89, 2, controlled ? COLORS.teal : '#3a4a44')
    label(
      context,
      controlled ? 'CONTROLADA' : 'SIN DATOS',
      194,
      92,
      4,
      controlled ? COLORS.teal : '#3a4a44',
      'center',
    )
  }
}

function drawFooter(
  context: CanvasRenderingContext2D,
  rows: { text: string; ok: boolean }[],
  time: number,
  reduced: boolean,
): void {
  const fixed = rows.filter((row) => row.ok).length
  const valid = fixed === 3
  const pulse = reduced ? 0.9 : 0.75 + 0.2 * Math.sin(time / 380)

  panel(context, 6, 100, 212, 22, 'rgba(8,20,16,0.92)', '#2f5a4a')
  label(
    context,
    `${fixed} DE 3 LÍNEAS EN SU SITIO`,
    12,
    112,
    5,
    valid ? COLORS.lime : '#d7e4df',
  )
  for (let index = 0; index < 3; index += 1) {
    const ok = rows[index]?.ok === true
    rect(context, 12 + index * 8, 116, 6, 3, ok ? COLORS.lime : '#3a1c20')
    rect(context, 12 + index * 8, 116, 6, 1, alpha(COLORS.paper, ok ? 0.2 : 0.04))
  }

  if (valid) {
    context.globalAlpha = pulse
    panel(context, 146, 103, 66, 15, 'rgba(47,107,58,0.92)', COLORS.lime)
    drawSprite(context, SPRITES.check, 150, 107, { scale: 1, palette: { g: COLORS.cream } })
    label(context, 'INFORME VÁLIDO', 160, 113, 4, COLORS.cream)
    context.globalAlpha = 1
  } else {
    panel(context, 146, 103, 66, 15, 'rgba(16,40,32,0.9)', '#3a5a4a')
    drawBug(context, 149, 108, '#8fbcb4', reduced ? 0 : time / 300)
    label(context, 'SIN VALIDAR', 210, 113, 4, '#8fbcb4', 'right')
  }
}

/** Lienzo del laboratorio: el monitor con el informe, las zonas y la trampa de bichos. */
export function PlagueScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<PlagueView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const rows = view.lines.length > 0 ? view.lines : [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER]
      const fixed = rows.filter((row) => row.ok).length

      gradient(context, 0, 0, 224, 128, '#0b1713', '#173427', 8)
      dither(context, 0, 0, 224, 128, alpha(COLORS.ink, 0.14), 4)
      for (let x = 12; x < 224; x += 24) {
        rect(context, x, 22, 1, 106, alpha(COLORS.teal, 0.05))
      }
      for (let y = 40; y < 128; y += 24) {
        rect(context, 0, y, 224, 1, alpha(COLORS.teal, 0.04))
      }

      panel(context, 4, 4, 216, 18, 'rgba(8,20,16,0.92)', '#2f5a4a')
      rect(context, 4, 4, 216, 1, alpha(COLORS.teal, 0.4))
      label(context, 'INFORME DE LA PLAGA', 12, 17, 7, COLORS.lime)
      label(
        context,
        `${fixed}/3 OK`,
        214,
        17,
        5,
        fixed === 3 ? COLORS.lime : '#b8a23a',
        'right',
      )

      for (let x = 4; x < 220; x += 8) {
        rect(context, x, 22, 4, 2, '#b8a23a')
        rect(context, x + 4, 22, 4, 2, alpha(COLORS.ink, 0.7))
      }

      drawZones(context, rows, time, reduced)
      drawMonitor(context, rows, time, reduced)
      drawTerrarium(context, rows, time, reduced)

      rect(context, 0, 96, 224, 4, alpha(COLORS.ink, 0.5))
      line(context, 156, 88, 164, 88, alpha(COLORS.teal, 0.35))
      line(context, 160, 74, 164, 64, alpha(COLORS.teal, 0.25))

      drawFooter(context, rows, time, reduced)

      rect(context, 0, 122, 224, 6, '#08120e')
      rect(context, 0, 122, 224, 1, alpha(COLORS.teal, 0.2))
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'plague') continue
      setView({ lines: step.lines })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const fixed = view.lines.filter((entry) => entry.ok).length
  const description =
    view.lines.length === 0
      ? 'El informe de la plaga está sin comprobar: las tres líneas esperan en el monitor.'
      : `El informe dice: ${view.lines
          .map((entry) => `«${entry.text}» ${entry.ok ? 'correcta' : 'con fallo'}`)
          .join(', ')}. ${fixed} de 3 líneas en su sitio.${fixed === 3 ? ' El informe está validado.' : ''}`

  return <PixelCanvas label={description} draw={draw} />
}
