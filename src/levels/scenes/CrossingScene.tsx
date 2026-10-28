import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
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
  label,
  panel,
  rand,
  rect,
} from '../../pixel/shapes'

interface CrossingView {
  redCrossed: boolean
  redWaited: boolean
  greenCrossed: boolean
  greenWaited: boolean
}

const RESTING: CrossingView = {
  redCrossed: false,
  redWaited: false,
  greenCrossed: false,
  greenWaited: false,
}

type Light = 'rojo' | 'verde'

interface Outcome {
  text: string
  colour: string
}

function outcomeFor(light: Light, crossed: boolean, waited: boolean): Outcome {
  if (light === 'rojo') {
    if (crossed) return { text: 'CRUZÓ · ¡MAL!', colour: COLORS.coral }
    if (waited) return { text: 'ESPERÓ · BIEN', colour: COLORS.lime }
    return { text: 'SIN ACCIÓN', colour: '#8fa3cc' }
  }
  if (crossed) return { text: 'CRUZÓ · BIEN', colour: COLORS.lime }
  if (waited) return { text: 'ESPERÓ · MAL', colour: COLORS.coral }
  return { text: 'SIN ACCIÓN', colour: '#8fa3cc' }
}

function drawSkyline(
  context: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  warm: boolean,
): void {
  const blocks: [number, number, number][] = [
    [4, 18, 24],
    [22, 14, 34],
    [38, 20, 26],
    [60, 16, 38],
    [78, 20, 22],
  ]
  blocks.forEach(([dx, width, height], index) => {
    const top = baseY - height
    rect(context, x + dx, top, width, height, index % 2 === 0 ? '#2a3450' : '#232c46')
    rect(context, x + dx, top, width, 1, '#3a4664')
    if (index % 3 === 1) rect(context, x + dx + 4, top - 3, 2, 3, COLORS.steel)

    for (let wy = top + 4; wy < baseY - 4; wy += 6) {
      for (let wx = x + dx + 3; wx < x + dx + width - 3; wx += 5) {
        const lit = rand(wx * 13 + wy * 7) > (warm ? 0.6 : 0.7)
        rect(context, wx, wy, 3, 3, lit ? (warm ? '#f2c46a' : '#b8d8f0') : '#1b2440')
      }
    }
  })
}

function drawWalker(
  context: CanvasRenderingContext2D,
  x: number,
  feetY: number,
  crossed: boolean,
  idle: boolean,
  time: number,
  reduced: boolean,
): void {
  const walking = crossed
  const bob = walking && !reduced ? Math.abs(Math.sin(time / 140)) : 0
  const stride = walking && !reduced ? Math.round(Math.sin(time / 160) * 2) : 0
  const top = feetY - 28 - Math.round(bob)

  rect(context, x - 6, feetY - 1, 13, 2, alpha(COLORS.ink, 0.28))

  // Piernas y zapatos.
  rect(context, x - 4, top + 19, 3, 8 + stride, '#2a2f3d')
  rect(context, x + 2, top + 19, 3, 8 - stride, '#2a2f3d')
  rect(context, x - 5, feetY - 2, 4, 2, '#1a1a22')
  rect(context, x + 2, feetY - 2, 4, 2, '#1a1a22')

  // Chaqueta y brazo.
  rect(context, x - 5, top + 9, 10, 11, COLORS.teal)
  rect(context, x + 2, top + 9, 3, 11, '#1e8a7a')
  rect(context, x + 4, top + 11, 2, 8, '#2aa391')
  rect(context, x - 7, top + 11, 3, 7, COLORS.coral)

  // Cabeza y pelo.
  rect(context, x - 4, top + 2, 8, 8, COLORS.skin)
  rect(context, x - 4, top, 8, 3, '#5a3e2b')
  rect(context, x + 2, top + 5, 1, 1, COLORS.ink)
  rect(context, x - 4, top + 5, 1, 1, COLORS.skinShade)

  if (idle) {
    label(context, '?', x + 10, top - 2, 7, COLORS.gold)
  }
}

function drawCard(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  light: Light,
  crossed: boolean,
  waited: boolean,
  time: number,
  reduced: boolean,
): void {
  const warm = light === 'rojo'
  const accent = warm ? COLORS.coral : COLORS.lime
  const base = y + 58

  bevel(context, x, y, width, height, '#141b2c', '#34425f', '#0a0f1c', COLORS.ink)

  // Cabecera de la prueba.
  rect(context, x + 1, y + 1, width - 2, 14, '#0c1322')
  disc(context, x + 8, y + 8, 2, accent)
  glow(context, x + 8, y + 8, 6, accent, 0.16)
  label(context, `${warm ? '1ª' : '2ª'} PRUEBA · ${warm ? 'ROJO' : 'VERDE'}`, x + 14, y + 11, 5, accent)

  context.save()
  context.beginPath()
  context.rect(x + 1, y + 15, width - 2, height - 17)
  context.clip()

  gradient(
    context,
    x + 1,
    y + 15,
    width - 2,
    43,
    warm ? '#f6b98a' : '#8fd3ff',
    warm ? '#ffe6c4' : '#e6f7ff',
    6,
  )

  const drift = reduced ? 0 : Math.round(Math.sin(time / 1900) * 2)
  cloud(
    context,
    x + 6 + drift,
    y + 19,
    28,
    warm ? '#fff1dc' : '#ffffff',
    warm ? '#f2d0aa' : '#d9ecf7',
  )
  cloud(
    context,
    x + 58 - drift,
    y + 27,
    22,
    warm ? '#fff1dc' : '#ffffff',
    warm ? '#f2d0aa' : '#d9ecf7',
  )

  const sunX = warm ? x + width - 26 : x + 20
  const sunY = warm ? y + 50 : y + 24
  glow(context, sunX, sunY, 12, warm ? COLORS.coral : COLORS.gold, 0.18)
  disc(context, sunX, sunY, 5, warm ? '#ffd2a8' : COLORS.yellow)
  disc(context, sunX - 1, sunY - 1, 3, warm ? '#ffe8c8' : COLORS.cream)

  drawSkyline(context, x, base, warm)

  // Calzada y acera.
  rect(context, x + 1, base, width - 2, 26, '#3a4152')
  rect(context, x + 1, base, width - 2, 2, '#50586d')
  for (let index = 0; index < 5; index += 1) {
    rect(context, x + 6 + index * 21, base + 11, 10, 2, alpha(COLORS.cream, 0.55))
  }
  rect(context, x + 1, base + 26, width - 2, 14, '#2c3548')
  rect(context, x + 1, base + 26, width - 2, 1, '#4a5568')
  for (let index = 0; index < 10; index += 1) {
    rect(context, x + 4 + index * 12, base + 30, 1, 8, alpha(COLORS.ink, 0.25))
  }

  // Paso de cebra.
  for (let index = 0; index < 6; index += 1) {
    const barX = x + 24 + index * 10
    rect(context, barX, base + 4, 6, 20, alpha('#f2e6cf', 0.9))
    rect(context, barX, base + 4, 6, 1, COLORS.cream)
  }

  // Semáforo peatonal.
  const poleX = x + width - 14
  glow(context, poleX + 2, warm ? y + 32 : y + 48, 10, accent, 0.14)
  rect(context, poleX + 1, y + 50, 2, 36, '#2a3147')
  rect(context, poleX - 3, y + 84, 10, 2, '#1c2434')
  rect(context, poleX - 5, y + 26, 12, 25, '#0a0f1c')
  rect(context, poleX - 4, y + 27, 10, 23, '#1d2638')
  for (let index = 0; index < 3; index += 1) {
    const lampY = y + 32 + index * 7
    const active = warm ? index === 0 : index === 2
    const lampColour = active
      ? index === 0
        ? COLORS.red
        : COLORS.lime
      : index === 0
        ? '#4a2a33'
        : index === 1
          ? '#4a4a2a'
          : '#1d3a2a'
    disc(context, poleX + 1, lampY, 2, lampColour)
    if (active) glow(context, poleX + 1, lampY, 6, lampColour, 0.28)
  }

  // Peatón: espera a la izquierda o cruza por la acera.
  const walkerX = crossed ? x + 62 : x + 18
  drawWalker(context, walkerX, base + 27, crossed, !crossed && !waited, time, reduced)

  // Paloma picoteando.
  const peck = reduced ? 0 : Math.round(Math.abs(Math.sin(time / 620)))
  rect(context, x + 80, base + 31, 5, 3, '#8a94a8')
  rect(context, x + 84, base + 29, 2, 2, '#8a94a8')
  rect(context, x + 81, base + 30 - peck, 1, 1, COLORS.coral)
  rect(context, x + 80, base + 33, 1, 2, '#5a6480')
  rect(context, x + 84, base + 33, 1, 2, '#5a6480')

  context.restore()
}

/** Lienzo del semáforo: las dos pruebas, con la luz roja y con la luz verde. */
export function CrossingScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<CrossingView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      gradient(context, 0, 0, 224, 128, '#0b1220', '#111a2e', 6)
      for (let index = 0; index < 12; index += 1) {
        rect(context, 0, 4 + index * 11, 224, 1, alpha(COLORS.steel, 0.05))
      }

      drawCard(context, 4, 4, 104, 100, 'rojo', view.redCrossed, view.redWaited, time, reduced)
      drawCard(context, 116, 4, 104, 100, 'verde', view.greenCrossed, view.greenWaited, time, reduced)

      const red = outcomeFor('rojo', view.redCrossed, view.redWaited)
      const green = outcomeFor('verde', view.greenCrossed, view.greenWaited)
      panel(context, 4, 106, 104, 16, 'rgba(10,16,30,0.94)', red.colour)
      label(context, red.text, 56, 117, 6, red.colour, 'center')
      panel(context, 116, 106, 104, 16, 'rgba(10,16,30,0.94)', green.colour)
      label(context, green.text, 168, 117, 6, green.colour, 'center')
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'crossing') continue
      setView({
        redCrossed: step.redCrossed,
        redWaited: step.redWaited,
        greenCrossed: step.greenCrossed,
        greenWaited: step.greenWaited,
      })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 520)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const describe = (light: Light, crossed: boolean, waited: boolean): string => {
    if (crossed) return light === 'rojo' ? 'cruzó con la luz roja' : 'cruzó'
    return waited ? 'esperó' : 'no hizo nada'
  }
  const description = `Con la luz roja el peatón ${describe('rojo', view.redCrossed, view.redWaited)}. Con la luz verde ${describe('verde', view.greenCrossed, view.greenWaited)}.`

  return <PixelCanvas label={description} draw={draw} />
}
