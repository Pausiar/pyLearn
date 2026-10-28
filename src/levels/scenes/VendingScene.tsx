import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { SALES, type SoldSale } from '../../engine/vending'
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
  panel,
  rand,
  rect,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

const SHELF_Y = [52, 72, 90]
const PRODUCT_X = [18, 33]
const TAG_X = 62

interface VendingView {
  sales: SoldSale[]
  done: boolean
}

const RESTING: VendingView = { sales: [], done: false }

/** Cada producto tiene su dibujo propio, apoyado en la balda que le toque. */
function drawProduct(
  context: CanvasRenderingContext2D,
  producto: string,
  x: number,
  bottom: number,
): void {
  if (producto === 'zumo') {
    line(context, x + 7, bottom - 18, x + 7, bottom - 12, COLORS.silver)
    rect(context, x + 1, bottom - 13, 7, 13, COLORS.gold)
    rect(context, x + 1, bottom - 13, 7, 1, '#f5d98a')
    rect(context, x + 1, bottom - 8, 7, 4, COLORS.brick)
    rect(context, x + 3, bottom - 7, 3, 2, COLORS.cream)
    rect(context, x + 7, bottom - 13, 1, 13, '#b8862e')
    return
  }

  if (producto === 'galletas') {
    rect(context, x, bottom - 12, 11, 11, COLORS.blue)
    rect(context, x, bottom - 12, 11, 2, COLORS.steel)
    rect(context, x, bottom - 12, 11, 1, COLORS.silver)
    rect(context, x + 1, bottom - 8, 9, 4, COLORS.cream)
    disc(context, x + 5, bottom - 6, 2, COLORS.wood)
    rect(context, x + 4, bottom - 7, 1, 1, COLORS.woodDark)
    rect(context, x + 6, bottom - 5, 1, 1, COLORS.woodDark)
    rect(context, x, bottom - 2, 11, 1, '#2b4a8a')
    return
  }

  rect(context, x + 1, bottom - 7, 7, 7, COLORS.paper)
  rect(context, x, bottom - 8, 9, 1, COLORS.silver)
  rect(context, x + 1, bottom - 7, 7, 2, COLORS.woodDark)
  rect(context, x + 7, bottom - 5, 3, 1, COLORS.paper)
  rect(context, x + 9, bottom - 4, 1, 3, COLORS.paper)
  rect(context, x + 7, bottom - 2, 3, 1, COLORS.paper)
  rect(context, x, bottom, 10, 1, COLORS.silver)
  rect(context, x + 10, bottom - 4, 1, 4, COLORS.silver)
  rect(context, x + 3, bottom - 12, 1, 2, alpha(COLORS.ice, 0.5))
  rect(context, x + 5, bottom - 13, 1, 3, alpha(COLORS.ice, 0.35))
}

function drawLamps(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  ;[17, 124].forEach((x, index) => {
    const beat = reduced ? 1 : 0.6 + 0.4 * Math.sin(time / 420 + index * 2)
    context.globalAlpha = beat
    disc(context, x, 16, 2, COLORS.gold)
    context.globalAlpha = beat * 0.25
    disc(context, x, 16, 4, COLORS.yellow)
    context.globalAlpha = 1
  })
}

function drawMachine(
  context: CanvasRenderingContext2D,
  view: VendingView,
  time: number,
  reduced: boolean,
): void {
  rect(context, 6, 116, 130, 3, alpha(COLORS.ink, 0.4))
  bevel(context, 9, 7, 124, 110, '#39445e', '#5f6c8c', '#232b3f', COLORS.ink)

  rect(context, 13, 11, 116, 18, '#111827')
  rect(context, 13, 11, 116, 1, '#2b3a55')
  dither(context, 13, 11, 116, 18, alpha(COLORS.ink, 0.3), 2)
  label(context, 'EXPENDEDORA', 71, 24, 8, COLORS.gold, 'center')
  drawLamps(context, time, reduced)

  rect(context, 13, 33, 82, 62, '#0d1522')
  gradient(context, 14, 34, 80, 58, '#16233a', '#0a121e', 6)

  const sold = view.sales.map((sale) => sale.producto)

  SALES.forEach((sale, index) => {
    const shelf = SHELF_Y[index] ?? 90
    const isSold = sold.includes(sale.producto)

    rect(context, 13, shelf - 1, 82, 1, alpha(COLORS.ice, 0.12))
    PRODUCT_X.slice(0, isSold ? 1 : 2).forEach((x) => {
      drawProduct(context, sale.producto, x + (isSold ? 7 : 0), shelf - 2)
    })

    panel(
      context,
      TAG_X,
      shelf + 2,
      26,
      8,
      isSold ? 'rgba(47,107,58,0.95)' : '#e8dcc0',
      isSold ? COLORS.green : '#8a7a5c',
    )
    if (isSold) {
      drawSprite(context, SPRITES.check, TAG_X + 4, shelf + 3, { scale: 1 })
      label(context, String(sale.precio), TAG_X + 23, shelf + 9, 5, COLORS.lime, 'right')
    } else {
      label(context, String(sale.precio), TAG_X + 13, shelf + 9, 6, '#241a20', 'center')
    }

    rect(context, 13, shelf + 1, 82, 2, COLORS.silver)
    rect(context, 13, shelf + 2, 82, 1, '#5c6678')
  })

  for (const [x, y] of [
    [20, 46],
    [58, 38],
    [26, 84],
  ] as const) {
    line(context, x, y, x + 14, y - 14, alpha(COLORS.paper, 0.07))
    line(context, x + 3, y, x + 17, y - 14, alpha(COLORS.paper, 0.05))
  }
  dither(context, 13, 33, 82, 62, alpha(COLORS.ink, 0.12), 3)

  bevel(context, 98, 33, 31, 62, '#2b3346', '#46527a', '#1a2030')
  label(context, 'MONEDA', 113, 42, 5, COLORS.silver, 'center')
  rect(context, 105, 46, 17, 3, COLORS.ink)
  rect(context, 105, 46, 17, 1, COLORS.silver)
  disc(context, 113, 51, 1, COLORS.gold)

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const bx = 102 + column * 9
      const by = 57 + row * 8
      bevel(context, bx, by, 6, 6, '#4a5872', '#6f7f9e', '#2c3548')
      rect(context, bx + 2, by + 2, 2, 2, alpha(COLORS.ink, 0.55))
    }
  }

  panel(context, 98, 82, 31, 14, '#0a1220', '#2f4a5a')
  label(context, 'CAMBIO', 113, 88, 5, COLORS.teal, 'center')
  const last = view.sales[view.sales.length - 1]
  label(
    context,
    last ? String(last.cambio) : '—',
    113,
    95,
    8,
    last ? '#8fd3a6' : '#3a5566',
    'center',
  )

  rect(context, 13, 98, 82, 16, '#080c14')
  gradient(context, 14, 99, 80, 12, '#0c1420', '#05080e', 4)
  rect(context, 15, 98, 78, 3, '#2a3548')
  rect(context, 15, 98, 78, 1, '#46527a')
  rect(context, 13, 112, 82, 2, '#1c2434')

  if (last) {
    drawProduct(context, last.producto, 22, 112)
    rect(context, 20, 112, 14, 1, alpha(COLORS.ink, 0.6))
    disc(context, 52, 109, 2, COLORS.gold)
    disc(context, 59, 106, 2, COLORS.gold)
    disc(context, 66, 109, 2, COLORS.gold)
    rect(context, 52, 108, 1, 1, '#f5d98a')
    rect(context, 59, 105, 1, 1, '#f5d98a')
    if (!reduced) {
      const blink = 0.5 + 0.5 * Math.sin(time / 260)
      context.globalAlpha = blink
      rect(context, 64, 104, 1, 1, COLORS.paper)
      context.globalAlpha = 1
    }
  } else {
    label(context, 'AQUÍ CAE EL CAMBIO', 54, 109, 5, '#3a5566', 'center')
  }

  rect(context, 9, 114, 124, 3, '#232b3f')
  rect(context, 12, 119, 6, 2, COLORS.ink)
  rect(context, 124, 119, 6, 2, COLORS.ink)
}

function drawTicket(
  context: CanvasRenderingContext2D,
  view: VendingView,
  time: number,
  reduced: boolean,
): void {
  rect(context, 141, 11, 78, 104, alpha(COLORS.ink, 0.4))
  rect(context, 139, 9, 78, 104, '#f2e4c6')
  rect(context, 139, 9, 78, 12, COLORS.brick)
  rect(context, 139, 9, 78, 1, '#c96a4a')
  label(context, 'TICKET', 178, 18, 7, COLORS.cream, 'center')
  rect(context, 144, 7, 4, 3, COLORS.silver)
  rect(context, 208, 7, 4, 3, COLORS.silver)

  for (let x = 139; x < 217; x += 6) {
    rect(context, x, 113, 4, 1, '#f2e4c6')
    rect(context, x + 3, 114, 4, 1, '#f2e4c6')
  }

  const sold = view.sales.map((sale) => sale.producto)

  SALES.forEach((sale, index) => {
    const y = 24 + index * 22
    const soldSale = view.sales.find((entry) => entry.producto === sale.producto)
    const isSold = sold.includes(sale.producto)

    panel(
      context,
      142,
      y,
      72,
      18,
      isSold ? 'rgba(143,211,166,0.28)' : '#ece0c6',
      isSold ? COLORS.green : '#b7a888',
    )
    label(context, sale.producto, 146, y + 8, 6, '#241a20')
    label(context, `${sale.pago} - ${sale.precio}`, 146, y + 15, 5, '#6a5a48')
    if (soldSale) {
      label(context, `= ${soldSale.cambio}`, 210, y + 15, 6, COLORS.forest, 'right')
      disc(context, 209, y + 5, 1, COLORS.gold)
    } else {
      label(context, '…', 210, y + 15, 6, '#9a8a70', 'right')
    }
  })

  const total = view.sales.reduce((sum, sale) => sum + sale.cambio, 0)
  label(context, 'TOTAL', 146, 96, 6, '#3c3026')
  label(
    context,
    view.sales.length === 0 ? '—' : String(total),
    210,
    96,
    8,
    view.done ? COLORS.forest : '#8a7a5c',
    'right',
  )

  if (view.done) {
    const pulse = reduced ? 1 : 0.75 + 0.25 * Math.sin(time / 300)
    context.globalAlpha = pulse
    rect(context, 148, 100, 64, 11, 'rgba(47,107,58,0.92)')
    rect(context, 148, 100, 64, 1, COLORS.lime)
    rect(context, 148, 110, 64, 1, COLORS.forest)
    drawSprite(context, SPRITES.check, 152, 102, {
      scale: 1,
      palette: { g: COLORS.lime },
    })
    label(context, 'TODO COBRADO', 171, 108, 5, COLORS.cream, 'center')
    context.globalAlpha = 1
    for (let index = 0; index < 6; index += 1) {
      const progress = reduced ? 0.6 : (time / 1500 + index / 6) % 1
      const px = Math.round(146 + rand(index + 5) * 66)
      context.globalAlpha = 0.6 * (1 - progress)
      rect(context, px, Math.round(100 - progress * 16), 1, 1, COLORS.gold)
    }
    context.globalAlpha = 1
  }
}

function drawVending(
  context: CanvasRenderingContext2D,
  view: VendingView,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 116, '#221c2a', '#3a2a2c', 8)
  dither(context, 0, 0, 224, 116, alpha(COLORS.ink, 0.16), 3)
  for (let y = 20; y < 116; y += 24) {
    rect(context, 0, y, 224, 1, alpha(COLORS.ink, 0.18))
    rect(context, 0, y + 1, 224, 1, alpha(COLORS.paper, 0.03))
  }

  rect(context, 0, 116, 224, 12, '#2a2028')
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 28; column += 1) {
      if ((row + column) % 2 === 0) continue
      rect(context, column * 8, 117 + row * 6, 8, 6, '#332630')
    }
  }
  rect(context, 0, 116, 224, 1, '#4a3640')
  speckleFloor(context)

  drawMachine(context, view, time, reduced)
  drawTicket(context, view, time, reduced)
}

function speckleFloor(context: CanvasRenderingContext2D): void {
  for (let index = 0; index < 18; index += 1) {
    rect(
      context,
      Math.round(rand(index + 41) * 224),
      Math.round(118 + rand(index + 77) * 9),
      1,
      1,
      alpha(COLORS.ink, 0.25),
    )
  }
}

/** Lienzo de la expendedora: las ventas dentro y el ticket con las cuentas. */
export function VendingScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<VendingView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawVending(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'vending') continue
      setView({ sales: step.sales, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 400)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const changes = view.sales.map((sale) => `${sale.producto}: ${sale.cambio}`).join(', ')
  const description =
    view.sales.length === 0
      ? 'La expendedora tiene tres ventas esperando el cambio.'
      : `Cambios devueltos: ${changes}.${view.done ? ' Las tres ventas están cobradas.' : ''}`

  return <PixelCanvas label={description} draw={draw} />
}
