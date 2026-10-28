import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { SHOP_ANSWERS, SHOP_GOAL } from '../../engine/shop'
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
  panel,
  rect,
  truncate,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface ShopView {
  questions: string[]
  message: string
}

const RESTING: ShopView = { questions: [], message: '' }

function drawBackdrop(context: CanvasRenderingContext2D): void {
  gradient(context, 0, 0, 224, 104, '#f7e8cd', '#e3bd8c', 8)
  dither(context, 0, 0, 224, 100, alpha('#a8763e', 0.07), 3)
  for (let x = 10; x < 224; x += 18) {
    rect(context, x, 0, 2, 100, alpha('#fff6e4', 0.16))
  }

  // Estanterías al fondo, con panes y tarros.
  for (const shelfY of [42, 60]) {
    rect(context, 8, shelfY, 208, 2, COLORS.wood)
    rect(context, 8, shelfY + 2, 208, 1, '#5c3a1c')
    for (const bracket of [34, 108, 182]) {
      rect(context, bracket, shelfY + 3, 2, 5, '#5c3a1c')
    }
  }
  for (const x of [12, 26, 40, 96, 112, 128, 144, 176, 192, 206]) {
    const long = x % 3 === 0
    rect(context, x, 36, long ? 12 : 9, 6, long ? '#d9a04e' : '#c9853c')
    rect(context, x + 1, 35, long ? 10 : 7, 1, '#f2c46a')
    rect(context, x + 1, 36, 2, 5, alpha('#fff3c4', 0.4))
    rect(context, x + 2, 38, 1, 1, '#8a5a2a')
    rect(context, x + 5, 39, 1, 1, '#8a5a2a')
  }
  for (const x of [14, 30, 46, 92, 120, 150, 180, 200]) {
    rect(context, x, 53, 10, 7, alpha(COLORS.ice, 0.35))
    rect(context, x + 1, 54, 8, 5, alpha('#f2e6cf', 0.6))
    rect(context, x + 3, 49, 4, 4, '#8a5a2b')
    rect(context, x + 3, 49, 4, 1, '#b07a3f')
    rect(context, x + 2, 55, 1, 4, alpha('#ffffff', 0.6))
  }

  // Suelo de baldosas.
  rect(context, 0, 100, 224, 28, '#c9a06a')
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 20; column += 1) {
      if ((row + column) % 2 === 0) {
        rect(context, column * 12, 100 + row * 9, 11, 8, '#b98a56')
      }
    }
  }
  rect(context, 0, 100, 224, 1, '#a8763e')

  // Banderines de panadería.
  const bunting = [COLORS.coral, COLORS.teal, COLORS.gold, COLORS.pink]
  rect(context, 0, 1, 224, 1, alpha('#5c3a1c', 0.6))
  for (let index = 0; index < 13; index += 1) {
    const x = 5 + index * 18
    const colour = bunting[index % bunting.length] ?? COLORS.coral
    rect(context, x, 2, 8, 1, colour)
    rect(context, x + 1, 3, 6, 1, colour)
    rect(context, x + 2, 4, 4, 1, colour)
    rect(context, x + 3, 5, 2, 1, colour)
  }
}

function drawChef(context: CanvasRenderingContext2D): void {
  drawSprite(context, SPRITES.chef, 38, 48, { scale: 3, outline: COLORS.ink })
}

function drawCounter(context: CanvasRenderingContext2D): void {
  // Encimera de cristal y frente de madera.
  rect(context, 6, 84, 212, 6, '#e8d3a8')
  rect(context, 6, 84, 212, 1, '#fff4d8')
  rect(context, 6, 89, 212, 1, '#8a5a2b')
  rect(context, 6, 90, 212, 16, '#8a5a2b')
  for (const x of [58, 110, 162]) {
    rect(context, x, 90, 1, 16, '#5c3a1c')
    rect(context, x + 1, 90, 1, 16, alpha('#b07a3f', 0.5))
  }
  dither(context, 6, 90, 212, 16, alpha('#3e2712', 0.25), 3)
  rect(context, 6, 104, 212, 2, '#5c3a1c')
  rect(context, 6, 90, 212, 1, '#b07a3f')
}

function drawTray(context: CanvasRenderingContext2D): void {
  bevel(context, 16, 76, 60, 8, '#b07a3f', '#d9b878', '#5c3a1c', COLORS.ink)
  for (const [x, colour] of [
    [22, '#d9a04e'],
    [38, '#c9853c'],
    [52, '#e0b060'],
    [66, '#c9853c'],
  ] as const) {
    rect(context, x, 72, 11, 4, colour)
    rect(context, x + 1, 71, 9, 1, '#f2c46a')
    rect(context, x + 2, 73, 1, 1, '#8a5a2a')
    rect(context, x + 6, 72, 1, 1, '#8a5a2a')
  }
}

function drawRegister(context: CanvasRenderingContext2D, view: ShopView): void {
  const complete = view.message === SHOP_GOAL
  const hasMessage = view.message !== ''

  bevel(context, 84, 54, 54, 30, '#26303c', '#4a5a6a', '#161c24', COLORS.ink)
  rect(context, 88, 58, 46, 12, '#0b1f16')
  rect(context, 88, 58, 46, 1, '#2a5468')
  if (complete) glow(context, 111, 64, 24, COLORS.lime, 0.14)
  label(
    context,
    truncate(hasMessage ? view.message : 'caja vacía', 15),
    111,
    67,
    5,
    complete ? COLORS.lime : hasMessage ? COLORS.cream : '#4f7a5f',
    'center',
  )

  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 5; column += 1) {
      rect(context, 88 + column * 9, 74 + row * 5, 7, 3, row === 0 ? '#3a4654' : '#2c3644')
      rect(context, 88 + column * 9, 74 + row * 5, 7, 1, '#5a6a7a')
    }
  }
  rect(context, 88, 82, 46, 2, '#161c24')
  rect(context, 106, 82, 10, 1, alpha(COLORS.gold, 0.6))

  if (complete) {
    const total = Number(view.message.match(/\d+/)?.[0] ?? 0)
    const coins = Math.min(Number.isFinite(total) && total > 0 ? total : 6, 6)
    rect(context, 92, 84, 36, 4, '#101828')
    rect(context, 92, 84, 36, 1, '#3a4654')
    for (let index = 0; index < coins; index += 1) {
      disc(context, 95 + index * 5, 87, 1, COLORS.gold)
    }
    for (let index = 0; index < 4; index += 1) {
      rect(context, 88 + index * 10, 50 - (index % 2) * 2, 1, 1, COLORS.lime)
    }
  }
}

function drawCustomer(context: CanvasRenderingContext2D): void {
  drawSprite(context, SPRITES.explorer, 148, 46, {
    scale: 4,
    flip: true,
    outline: COLORS.ink,
    palette: { g: COLORS.teal },
  })
}

function drawQuestions(context: CanvasRenderingContext2D, view: ShopView): void {
  panel(context, 6, 8, 100, 46, 'rgba(58,38,24,0.9)', '#8a5a2b')
  label(context, 'TUS PREGUNTAS', 12, 18, 5, COLORS.cream)
  label(context, `${view.questions.length}/${SHOP_ANSWERS.length}`, 100, 18, 5, COLORS.gold, 'right')
  rect(context, 12, 21, 88, 1, alpha(COLORS.cream, 0.25))

  for (let index = 0; index < SHOP_ANSWERS.length; index += 1) {
    const y = 32 + index * 10
    const question = view.questions[index]
    disc(context, 14, y - 2, 1, question ? COLORS.lime : '#6a5038')
    label(
      context,
      question ? truncate(question, 21) : '· · ·',
      20,
      y,
      5,
      question ? COLORS.paper : '#a68a68',
    )
  }
}

function drawBubble(context: CanvasRenderingContext2D, view: ShopView): void {
  const complete = view.message === SHOP_GOAL
  const text = complete
    ? '¡Gracias!'
    : view.questions.length > 0
      ? truncate(view.questions.at(-1) ?? '', 24)
      : '¿Me preguntas algo?'
  const width = Math.min(102, Math.max(46, Math.round(text.length * 3.4) + 14))
  const x = 216 - width

  rect(context, x, 8, width, 22, '#fff7e8')
  rect(context, x, 8, width, 1, '#ffffff')
  rect(context, x, 29, width, 1, '#c9a06a')
  rect(context, x, 8, 1, 22, '#c9a06a')
  rect(context, x + width - 1, 8, 1, 22, '#c9a06a')
  rect(context, 168, 30, 6, 2, '#fff7e8')
  rect(context, 169, 32, 4, 2, '#fff7e8')
  rect(context, 170, 34, 2, 1, '#fff7e8')
  rect(context, 168, 31, 1, 2, '#c9a06a')
  rect(context, 173, 31, 1, 2, '#c9a06a')
  label(context, text, x + 7, 22, 5, '#3a2a18')
}

/** Lienzo de la panadería: el cliente responde y la caja cobra el total. */
export function ShopScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<ShopView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const complete = view.message === SHOP_GOAL

      drawBackdrop(context)
      drawChef(context)
      drawCounter(context)
      drawTray(context)
      drawRegister(context, view)
      drawCustomer(context)
      drawQuestions(context, view)
      drawBubble(context, view)

      if (complete) {
        for (let index = 0; index < 6; index += 1) {
          const x = 120 + index * 14
          const y = 38 + (reduced ? 0 : Math.sin(time / 380 + index * 2) * 2)
          rect(context, x, y, 1, 1, COLORS.lime)
          rect(context, x + 1, y + 1, 1, 1, COLORS.gold)
        }
      }

      panel(context, 6, 110, 212, 15, 'rgba(26,16,10,0.92)', complete ? COLORS.green : '#6a5548')
      const status = complete
        ? `¡Cobrado! La caja dice «${SHOP_GOAL}».`
        : view.message !== ''
          ? 'La caja no cuadra: revisa el total y el mensaje.'
          : view.questions.length < SHOP_ANSWERS.length
            ? `Preguntas hechas: ${view.questions.length} de ${SHOP_ANSWERS.length}.`
            : 'El cliente ha respondido, pero falta cobrar.'
      label(context, status, 12, 120, 6, complete ? COLORS.lime : view.message !== '' ? COLORS.coral : COLORS.cream)
      disc(context, 207, 117, 3, complete ? COLORS.lime : view.message !== '' ? COLORS.coral : '#7a5a3a')
      if (complete) glow(context, 207, 117, 7, COLORS.lime, 0.2)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'shop') continue
      setView({ questions: step.questions, message: step.message })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 520)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.message === ''
      ? `El cliente ha respondido a ${view.questions.length} de ${SHOP_ANSWERS.length} preguntas.`
      : `El cliente ha respondido a ${view.questions.length} de ${SHOP_ANSWERS.length} preguntas. La caja dice: ${view.message}.`

  return <PixelCanvas label={description} draw={draw} />
}
