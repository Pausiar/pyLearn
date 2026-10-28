import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { SIGN_GOAL } from '../../engine/signs'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  brickWall,
  dither,
  disc,
  glow,
  gradient,
  label,
  panel,
  rand,
  rect,
  starfield,
  truncate,
  windowPane,
} from '../../pixel/shapes'

interface SignsView {
  text: string
  lit: boolean
}

const RESTING: SignsView = { text: '', lit: false }

function drawSkyline(context: CanvasRenderingContext2D): void {
  for (let index = 0; index < 12; index += 1) {
    const width = 16 + Math.round(rand(index + 5) * 10)
    const x = index * 19 - 2
    const height = 30 + Math.round(rand(index + 9) * 40)
    const top = 96 - height
    rect(context, x, top, width, height, index % 2 === 0 ? '#141126' : '#19152c')
    rect(context, x, top, width, 1, '#272040')
    if (index % 3 === 0) rect(context, x + 4, top - 4, 1, 4, COLORS.steel)

    for (let wy = top + 5; wy < 90; wy += 7) {
      for (let wx = x + 3; wx < x + width - 4; wx += 6) {
        if (rand(wx * 31 + wy * 7) > 0.58) {
          windowPane(context, wx, wy, 4, 4, true, '#241f38', rand(wx * 3 + wy) > 0.5 ? COLORS.gold : COLORS.cyan)
        }
      }
    }
  }
}

function drawLamp(context: CanvasRenderingContext2D, x: number, colour: string): void {
  glow(context, x, 54, 12, colour, 0.2)
  rect(context, x, 54, 1, 44, COLORS.steel)
  rect(context, x - 3, 96, 7, 3, COLORS.slate)
  rect(context, x - 3, 53, 7, 3, '#1c2434')
  rect(context, x - 2, 54, 5, 1, colour)
  rect(context, x - 1, 55, 3, 1, alpha(colour, 0.7))
}

function drawShop(context: CanvasRenderingContext2D, view: SignsView, time: number, reduced: boolean): void {
  const complete = view.lit && view.text === SIGN_GOAL
  const lit = view.lit

  // Fachada de ladrillo y cornisas.
  rect(context, 46, 44, 132, 56, '#1d1728')
  brickWall(context, 48, 46, 128, 54, '#33263f', '#241b2e')
  dither(context, 48, 46, 128, 54, alpha('#100c1a', 0.22), 3)
  rect(context, 46, 44, 132, 3, '#453858')
  rect(context, 48, 42, 128, 2, '#5a4a72')
  bevel(context, 46, 46, 6, 54, '#3a2c48', '#5a4a72', '#120e1c')
  bevel(context, 168, 46, 6, 54, '#3a2c48', '#5a4a72', '#120e1c')

  // Toldo a rayas.
  for (let index = 0; index < 8; index += 1) {
    const x = 52 + index * 15
    rect(context, x, 45, 14, 7, index % 2 === 0 ? COLORS.coral : '#f2e6cf')
    if (index % 2 === 0) rect(context, x, 50, 7, 2, '#c9554d')
  }
  for (let index = 0; index < 8; index += 1) {
    const x = 54 + index * 15
    const colour = index % 2 === 0 ? COLORS.coral : '#f2e6cf'
    rect(context, x, 52, 5, 2, colour)
    rect(context, x + 3, 54, 2, 2, colour)
  }

  // Escaparate encendido.
  bevel(context, 86, 62, 50, 30, '#241b2e', '#4a3a5c', '#120d18', COLORS.ink)
  const warm = lit ? '#6a4a30' : '#3a2a28'
  rect(context, 89, 65, 44, 24, warm)
  if (lit) glow(context, 111, 77, 24, COLORS.gold, 0.12)
  rect(context, 90, 79, 42, 1, '#8a6a48')
  for (let index = 0; index < 3; index += 1) {
    disc(context, 98 + index * 12, 77, 3, index === 1 ? COLORS.pink : COLORS.cream)
    rect(context, 97 + index * 12, 78, 4, 1, '#6a4a30')
  }
  rect(context, 126, 68, 5, 10, '#3a5a3a')
  rect(context, 124, 77, 9, 4, '#8a4a3e')

  // Gato negro en el alféizar.
  rect(context, 121, 85, 8, 4, '#0b0a12')
  rect(context, 129, 82, 2, 4, '#0b0a12')
  rect(context, 120, 80, 6, 6, '#0b0a12')
  rect(context, 121, 78, 2, 2, '#0b0a12')
  rect(context, 124, 78, 2, 2, '#0b0a12')
  rect(context, 121, 82, 1, 1, COLORS.gold)
  rect(context, 124, 82, 1, 1, COLORS.gold)

  // Puerta.
  bevel(context, 56, 64, 24, 36, '#2a2030', '#4a3a5c', '#120d18', COLORS.ink)
  rect(context, 59, 68, 18, 30, lit ? '#4a3428' : '#291f24')
  rect(context, 60, 69, 16, 28, alpha(COLORS.gold, lit ? 0.24 : 0.08))
  rect(context, 74, 82, 2, 4, COLORS.gold)
  rect(context, 59, 68, 18, 1, alpha(COLORS.cream, 0.25))

  // Cartel de neón.
  bevel(context, 52, 13, 120, 32, '#0d0a18', '#3a3050', '#06040c', COLORS.ink)
  const tube = complete ? COLORS.gold : COLORS.pink
  const flicker = reduced ? 1 : 0.86 + 0.14 * Math.abs(Math.sin(time / 140))

  if (lit) {
    glow(context, 112, 30, 42, tube, 0.17 * flicker)
    glow(context, 112, 30, 20, complete ? COLORS.cream : COLORS.pink, 0.12 * flicker)
    context.globalAlpha = flicker
    rect(context, 55, 16, 114, 1, tube)
    rect(context, 55, 42, 114, 1, tube)
    rect(context, 55, 16, 1, 27, tube)
    rect(context, 168, 16, 1, 27, tube)
    label(context, truncate(view.text, 20), 112, 35, 8, complete ? COLORS.cream : COLORS.coral, 'center')
    rect(context, 66, 39, 92, 1, alpha(tube, 0.6))
    context.globalAlpha = 1
  } else {
    rect(context, 55, 16, 114, 1, '#4a3c66')
    rect(context, 55, 42, 114, 1, '#4a3c66')
    rect(context, 55, 16, 1, 27, '#4a3c66')
    rect(context, 168, 16, 1, 27, '#4a3c66')
    glow(context, 112, 30, 12, COLORS.pink, 0.05)
    label(context, '· · ·', 112, 35, 9, alpha(COLORS.pink, 0.55), 'center')
    label(context, 'SIN ENCENDER', 112, 41, 4, '#9a8ec0', 'center')
  }

  for (let index = 0; index < 14; index += 1) {
    const x = 58 + index * 8
    const on = lit && (reduced || Math.sin(time / 160 + index * 1.3) > -0.4)
    rect(context, x, 11, 2, 2, on ? COLORS.cream : '#2a2440')
  }

  // Luz derramada sobre la acera.
  if (lit) {
    for (let index = 0; index < 12; index += 1) {
      const x = 58 + index * 9
      const height = 6 + Math.round(rand(index + 7) * 12)
      context.globalAlpha = 0.08 + 0.06 * Math.abs(Math.sin(time / 700 + index))
      rect(context, x, 100, 3, height, complete ? COLORS.gold : COLORS.magenta)
    }
    context.globalAlpha = 1
  }
}

function drawBlade(
  context: CanvasRenderingContext2D,
  x: number,
  word: string,
  colour: string,
): void {
  const height = word.length * 8 + 10
  rect(context, x - 2, 26, 16, height, '#0c0a18')
  rect(context, x - 1, 27, 1, height - 2, colour)
  rect(context, x + 13, 27, 1, height - 2, colour)
  glow(context, x + 6, 27 + height / 2, 16, colour, 0.12)
  word.split('').forEach((letter, index) => {
    label(context, letter, x + 6, 37 + index * 8, 6, colour, 'center')
  })
}

/** Lienzo de la ciudad: el letrero de neón se enciende sobre la calle mojada. */
export function SignsScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<SignsView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      gradient(context, 0, 0, 224, 96, '#0b0a1c', '#3a2450', 9)
      dither(context, 0, 0, 224, 60, alpha(COLORS.magenta, 0.05), 3)
      starfield(context, 0, 0, 224, 52, COLORS.ice, 21, 26, time, reduced)

      glow(context, 196, 16, 13, COLORS.ice, 0.16)
      disc(context, 196, 16, 6, '#dfe8ff')
      disc(context, 194, 14, 2, '#c3cfe8')
      rect(context, 198, 17, 2, 1, '#c3cfe8')
      rect(context, 199, 13, 1, 1, '#b6c2dd')
      rect(context, 193, 19, 1, 1, '#b6c2dd')

      drawSkyline(context)

      rect(context, 0, 96, 224, 32, '#0b0a16')
      rect(context, 0, 95, 224, 2, '#221e30')
      for (let index = 0; index < 30; index += 1) {
        const x = Math.round(rand(index + 31) * 224)
        const y = 99 + Math.round(rand(index + 57) * 26)
        rect(context, x, y, 2, 1, alpha(COLORS.steel, 0.35))
      }

      drawLamp(context, 36, COLORS.gold)
      drawLamp(context, 188, COLORS.gold)

      drawShop(context, view, time, reduced)
      drawBlade(context, 4, 'CAFÉ', COLORS.pink)
      drawBlade(context, 204, 'HOTEL', COLORS.cyan)

      // Reflejos en el asfalto.
      if (view.lit) {
        for (let index = 0; index < 14; index += 1) {
          const x = 54 + index * 9
          const drift = reduced ? 0 : Math.round(Math.sin(time / 500 + index) * 2)
          context.globalAlpha = 0.1 + 0.05 * Math.abs(Math.sin(time / 640 + index))
          rect(context, x + drift, 100, 2, 10 + (index % 3) * 4, view.text === SIGN_GOAL ? COLORS.gold : COLORS.pink)
        }
        context.globalAlpha = 1
      }

      // Hidrante y papeleras dan vida a la acera.
      bevel(context, 6, 96, 5, 9, COLORS.red, COLORS.coral, COLORS.brickDark)
      rect(context, 4, 99, 9, 2, COLORS.coral)
      rect(context, 7, 94, 3, 2, COLORS.coral)
      bevel(context, 176, 94, 9, 11, '#3a3448', '#5a5470', '#1c1828')
      rect(context, 175, 93, 11, 2, '#5a5470')
      rect(context, 178, 97, 5, 1, alpha(COLORS.paper, 0.2))

      const complete = view.lit && view.text === SIGN_GOAL
      panel(context, 6, 110, 212, 15, 'rgba(8,7,18,0.92)', complete ? COLORS.green : '#3a3050')
      const status = complete
        ? '¡LETRERO EXACTO! La ciudad ya tiene su neón.'
        : view.lit
          ? 'Neón encendido, pero el texto no es el pedido.'
          : 'El letrero está apagado: llama a letrero(texto).'
      label(context, status, 12, 120, 6, complete ? COLORS.lime : view.lit ? COLORS.coral : COLORS.ice)
      rect(context, 196, 114, 16, 7, '#0d0a18')
      rect(context, 196, 114, 16, 1, complete ? COLORS.gold : COLORS.pink)
      label(context, '24H', 204, 120, 5, complete ? COLORS.gold : COLORS.pink, 'center')
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'sign') continue
      setView({ text: step.text, lit: step.lit })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 480)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.lit
    ? `El letrero de neón está encendido y dice «${view.text}».`
    : 'El letrero de neón de la tienda está apagado.'

  return <PixelCanvas label={description} draw={draw} />
}
