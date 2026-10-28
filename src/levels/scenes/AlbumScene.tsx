import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { ALBUM_REPES } from '../../engine/album'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  disc,
  dither,
  gradient,
  label,
  line,
  mix,
  panel,
  rand,
  rect,
  speckle,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface AlbumView {
  cards: string[]
  unique: string[]
  ficha: [string, number] | null
  delivered: boolean
}

const RESTING: AlbumView = {
  cards: [...ALBUM_REPES],
  unique: [],
  ficha: null,
  delivered: false,
}

const SLOT_X = [18, 50, 82]
const SLOT_Y = [32, 68]
const SLOT_W = 28
const SLOT_H = 32

const CARD_BG: Record<string, [string, string]> = {
  gol: ['#2f6b3a', '#1e4a2a'],
  mate: ['#2b4a6a', '#1b2a4a'],
  rey: ['#3a2a5c', '#241a3c'],
}

function drawBall(context: CanvasRenderingContext2D, cx: number, cy: number): void {
  disc(context, cx, cy, 6, COLORS.paper)
  rect(context, cx - 2, cy - 2, 4, 4, '#1b202c')
  rect(context, cx - 2, cy - 2, 2, 1, '#2a3147')
  rect(context, cx - 5, cy, 2, 2, '#1b202c')
  rect(context, cx + 3, cy - 1, 2, 2, '#1b202c')
  rect(context, cx - 1, cy + 3, 2, 2, '#1b202c')
  rect(context, cx - 4, cy - 4, 1, 1, '#a8b0c0')
}

function drawMate(context: CanvasRenderingContext2D, cx: number, cy: number): void {
  disc(context, cx - 1, cy + 1, 6, '#8a5a2b')
  disc(context, cx - 1, cy + 1, 4, '#b07a3f')
  rect(context, cx - 5, cy - 4, 9, 2, COLORS.silver)
  rect(context, cx - 4, cy - 5, 7, 1, COLORS.paper)
  line(context, cx + 2, cy - 3, cx + 5, cy - 8, COLORS.gold)
  rect(context, cx + 5, cy - 9, 1, 2, COLORS.cream)
  rect(context, cx - 7, cy - 5, 2, 1, COLORS.lime)
  rect(context, cx - 8, cy - 6, 1, 2, COLORS.lime)
}

function drawCrown(context: CanvasRenderingContext2D, cx: number, cy: number): void {
  rect(context, cx - 6, cy + 1, 13, 4, COLORS.gold)
  rect(context, cx - 6, cy + 1, 13, 1, COLORS.yellow)
  rect(context, cx - 6, cy - 3, 3, 4, COLORS.gold)
  rect(context, cx - 1, cy - 5, 3, 6, COLORS.gold)
  rect(context, cx + 4, cy - 3, 3, 4, COLORS.gold)
  rect(context, cx - 6, cy - 4, 1, 1, COLORS.cream)
  rect(context, cx, cy - 6, 1, 1, COLORS.cream)
  rect(context, cx + 5, cy - 4, 1, 1, COLORS.cream)
  disc(context, cx, cy + 2, 1, COLORS.red)
  rect(context, cx - 4, cy + 2, 1, 1, COLORS.teal)
  rect(context, cx - 7, cy + 1, 2, 1, alpha(COLORS.ink, 0.4))
  rect(context, cx + 6, cy + 1, 1, 1, alpha(COLORS.ink, 0.4))
}

function drawSticker(
  context: CanvasRenderingContext2D,
  card: string,
  x: number,
  y: number,
  bright: boolean,
  repeat: boolean,
  time: number,
  reduced: boolean,
  fresh: boolean,
): void {
  const [top, bottom] = CARD_BG[card] ?? ['#3a3a4a', '#1b1b28']

  rect(context, x, y, SLOT_W, SLOT_H, '#171226')
  rect(context, x + 1, y + 1, SLOT_W - 2, SLOT_H - 2, bright ? top : mix(top, '#221c34', 0.6))
  gradient(context, x + 1, y + 1, SLOT_W - 2, 22, bright ? top : '#2a2338', bright ? bottom : '#1b1628', 4)

  if (card === 'gol') drawBall(context, x + 14, y + 11)
  else if (card === 'mate') drawMate(context, x + 14, y + 12)
  else drawCrown(context, x + 14, y + 12)

  if (bright && !repeat) {
    rect(context, x + 1, y + 1, SLOT_W - 2, 1, alpha(COLORS.paper, 0.25))
    rect(context, x + 1, y + 1, 1, SLOT_H - 2, alpha(COLORS.paper, 0.12))
    const shine = reduced ? 12 : (time / 26 + x) % (SLOT_W + 10) - 5
    if (shine > 0 && shine < SLOT_W) {
      context.globalAlpha = 0.4
      line(context, x + shine, y + 2, x + shine - 8, y + 20, COLORS.paper)
      context.globalAlpha = 1
    }
  }

  if (repeat) {
    rect(context, x + 1, y + 1, SLOT_W - 2, SLOT_H - 2, alpha('#241a3a', 0.45))
    dither(context, x + 1, y + 1, SLOT_W - 2, SLOT_H - 2, alpha(COLORS.ink, 0.25), 2)
    rect(context, x + 9, y + 8, 14, 6, alpha('#7d2f26', 0.92))
    label(context, 'REPE', x + 16, y + 13, 4, COLORS.cream, 'center')
  }

  label(
    context,
    card.toUpperCase(),
    x + 14,
    y + 28,
    5,
    repeat ? '#a08fbe' : bright ? COLORS.paper : '#8a80a8',
    'center',
  )

  if (fresh) {
    const pulse = reduced ? 0.7 : 0.35 + 0.3 * Math.sin(time / 240)
    context.globalAlpha = pulse
    rect(context, x, y, SLOT_W, 1, COLORS.lime)
    context.globalAlpha = 1
    drawSprite(context, SPRITES.check, x + SLOT_W - 9, y + 2, {
      scale: 1,
      palette: { g: COLORS.lime },
    })
  }
}

function drawPage(
  context: CanvasRenderingContext2D,
  view: AlbumView,
  time: number,
  reduced: boolean,
): void {
  rect(context, 8, 10, 108, 104, '#120e20')
  rect(context, 6, 8, 108, 104, '#2a2044')
  rect(context, 6, 8, 108, 2, '#4a3a6a')
  rect(context, 6, 8, 2, 104, '#4a3a6a')
  rect(context, 4, 12, 6, 96, '#1b1530')
  for (let index = 0; index < 5; index += 1) {
    const y = 19 + index * 19
    rect(context, 4, y, 6, 3, '#8a80a8')
    rect(context, 5, y + 1, 3, 1, '#2a2044')
    rect(context, 4, y, 6, 1, '#c4b8dc')
  }

  rect(context, 12, 14, 98, 92, '#221a38')
  rect(context, 12, 14, 98, 1, alpha(COLORS.violet, 0.4))
  label(context, 'ÁLBUM DE CROMOS', 16, 24, 6, COLORS.violet)
  label(context, `${view.cards.length} CROMOS`, 106, 23, 4, '#8a80a8', 'right')
  rect(context, 16, 27, 90, 1, alpha(COLORS.violet, 0.25))

  const firstSeen = new Map<string, number>()
  view.cards.forEach((card, index) => {
    if (!firstSeen.has(card)) firstSeen.set(card, index)
  })
  const fresh = view.unique[view.unique.length - 1]

  view.cards.slice(0, 6).forEach((card, index) => {
    const x = SLOT_X[index % 3]!
    const y = SLOT_Y[Math.floor(index / 3)]!
    const repeat = firstSeen.get(card) !== index
    const bright = view.unique.includes(card)
    drawSticker(
      context,
      card,
      x,
      y,
      bright,
      repeat,
      time + index * 30,
      reduced,
      bright && card === fresh && !repeat && view.unique.length > 0,
    )
  })

  if (view.cards.length === 0) {
    label(context, 'SIN CROMOS AÚN', 61, 66, 6, '#5f527a', 'center')
  }

  const distinct = new Set(view.cards).size
  rect(context, 12, 100, 98, 6, '#1b1530')
  label(
    context,
    `${view.unique.length} ÚNICOS · ${view.cards.length - distinct} REPES`,
    16,
    105,
    4,
    '#a08fbe',
  )
}

function drawTray(
  context: CanvasRenderingContext2D,
  view: AlbumView,
  time: number,
  reduced: boolean,
): void {
  panel(context, 118, 8, 100, 64, 'rgba(27,21,48,0.95)', '#4a3a6a')
  rect(context, 118, 8, 100, 1, alpha(COLORS.violet, 0.5))
  label(context, 'ÚNICOS', 124, 19, 6, COLORS.violet)
  if (view.delivered) {
    rect(context, 176, 11, 36, 10, 'rgba(47,107,58,0.92)')
    drawSprite(context, SPRITES.check, 178, 12, { scale: 1, palette: { g: COLORS.lime } })
    label(context, 'ENTREGADO', 210, 18, 4, COLORS.cream, 'right')
  } else {
    label(context, `${view.unique.length}/3`, 212, 18, 5, COLORS.gold, 'right')
  }

  const wanted = ['gol', 'mate', 'rey']
  wanted.forEach((card, index) => {
    const x = 128 + index * 30
    const kept = view.unique.includes(card)
    panel(
      context,
      x,
      24,
      26,
      32,
      kept ? 'rgba(58,42,92,0.95)' : '#171226',
      kept ? COLORS.violet : '#332a4a',
    )
    if (kept) {
      if (card === 'gol') drawBall(context, x + 13, 36)
      else if (card === 'mate') drawMate(context, x + 13, 37)
      else drawCrown(context, x + 13, 38)
      rect(context, x + 17, 25, 9, 9, alpha(COLORS.ink, 0.65))
      drawSprite(context, SPRITES.check, x + 18, 26, { scale: 1, palette: { g: COLORS.lime } })
    } else {
      rect(context, x + 10, 34, 6, 6, '#241d3a')
      rect(context, x + 11, 35, 4, 4, '#171226')
      label(context, '?', x + 13, 39, 5, '#4f4268', 'center')
    }
    label(context, card.toUpperCase(), x + 13, 62, 4, kept ? COLORS.cream : '#5f527a', 'center')
  })

  if (view.unique.length === 3 && !view.delivered) {
    const pulse = reduced ? 1 : 0.75 + 0.25 * Math.sin(time / 260)
    context.globalAlpha = pulse
    label(context, 'LISTO PARA ENTREGAR', 168, 68, 4, COLORS.gold, 'center')
    context.globalAlpha = 1
  }
}

function drawFicha(
  context: CanvasRenderingContext2D,
  view: AlbumView,
  time: number,
  reduced: boolean,
): void {
  rect(context, 120, 78, 96, 36, alpha(COLORS.ink, 0.45))
  rect(context, 118, 76, 96, 36, '#efe0c2')
  rect(context, 118, 76, 96, 1, '#fff4dc')
  rect(context, 118, 78, 96, 1, alpha(COLORS.wood, 0.35))
  disc(context, 126, 83, 2, '#d8c8a8')
  disc(context, 126, 83, 1, '#b7a888')
  label(context, 'FICHA', 133, 86, 5, '#6a5a48')
  rect(context, 133, 89, 76, 1, alpha(COLORS.wood, 0.3))

  if (view.ficha === null) {
    label(context, 'sin guardar', 166, 101, 5, '#9a8a70', 'center')
    rect(context, 140, 104, 52, 1, alpha('#9a8a70', 0.6))
  } else {
    label(context, `("${view.ficha[0]}",`, 136, 103, 8, '#3c3026')
    label(context, String(view.ficha[1]), 179, 103, 8, COLORS.brickDark)
    label(context, ')', 190, 103, 8, '#3c3026')
    label(context, 'NOMBRE Y NÚMERO', 136, 109, 4, '#8a7a5c')
  }

  if (view.delivered) {
    const pulse = reduced ? 0.9 : 0.7 + 0.25 * Math.sin(time / 300)
    context.globalAlpha = pulse
    rect(context, 176, 80, 38, 10, 'rgba(47,107,58,0.92)')
    rect(context, 176, 80, 38, 1, COLORS.lime)
    drawSprite(context, SPRITES.check, 178, 81, { scale: 1, palette: { g: COLORS.lime } })
    label(context, 'OK', 210, 87, 5, COLORS.cream, 'right')
    context.globalAlpha = 1
  }
}

function drawDesk(context: CanvasRenderingContext2D, view: AlbumView, time: number, reduced: boolean): void {
  gradient(context, 0, 0, 224, 128, '#171226', '#241a38', 8)
  speckle(context, 0, 0, 224, 128, alpha(COLORS.violet, 0.12), 19, 30)
  speckle(context, 0, 0, 224, 128, alpha(COLORS.paper, 0.06), 71, 18)

  if (!reduced) {
    for (let index = 0; index < 10; index += 1) {
      const twinkle = 0.25 + 0.25 * Math.sin(time / 700 + index * 1.7)
      context.globalAlpha = twinkle
      rect(context, Math.round(rand(index + 3) * 224), Math.round(rand(index + 47) * 120), 1, 1, COLORS.cream)
    }
    context.globalAlpha = 1
  }

  drawPage(context, view, time, reduced)
  drawTray(context, view, time, reduced)
  drawFicha(context, view, time, reduced)

  rect(context, 0, 114, 224, 14, '#191326')
  rect(context, 0, 114, 224, 1, '#2f2348')
  speckle(context, 0, 116, 224, 12, alpha(COLORS.ink, 0.3), 33, 12)

  const loose = view.cards.slice(0, 2)
  loose.forEach((card, index) => {
    const x = 16 + index * 17
    rect(context, x, 116, 14, 10, '#efe0c2')
    rect(context, x, 116, 14, 1, '#fff4dc')
    rect(context, x + 2, 118, 10, 6, CARD_BG[card]?.[0] ?? '#3a3a4a')
    if (card === 'gol') drawBall(context, x + 7, 121)
    else if (card === 'mate') drawMate(context, x + 7, 121)
    else drawCrown(context, x + 7, 121)
  })

  line(context, 70, 120, 84, 114, COLORS.silver)
  line(context, 70, 121, 84, 115, '#6b7590')
  disc(context, 68, 121, 2, '#7d2f26')
  disc(context, 68, 119, 2, '#7d2f26')
  rect(context, 92, 118, 18, 8, '#2f2348')
  rect(context, 92, 118, 18, 1, '#4a3a6a')
  label(context, 'SOBRES', 101, 124, 3, '#8a80a8', 'center')

  if (view.delivered) {
    for (let index = 0; index < 14; index += 1) {
      const progress = reduced ? 0.5 : (time / 1800 + index / 14) % 1
      context.globalAlpha = 0.8 * (1 - progress)
      const x = 120 + rand(index + 5) * 98
      const y = 76 - progress * 60
      rect(context, Math.round(x), Math.round(y), 1, 2, index % 3 === 0 ? COLORS.gold : index % 3 === 1 ? COLORS.lime : COLORS.violet)
    }
    context.globalAlpha = 1
  }
}

/** Lienzo del álbum: los cromos, los repes y la ficha guardada como tupla. */
export function AlbumScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<AlbumView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawDesk(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'album') continue
      setView({ cards: step.cards, unique: step.unique, ficha: step.ficha, delivered: step.delivered })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.cards.length === 0
      ? 'El álbum está vacío.'
      : view.unique.length === 0
        ? `El sobre ha dejado ${view.cards.length} cromos: gol, mate y rey, con repes. Todavía no hay ninguno guardado.`
        : `El álbum tiene ${view.unique.length} cromos únicos: ${view.unique.join(', ') || 'ninguno'}.${
            view.ficha === null ? '' : ` La ficha guardada es ${view.ficha[0]} con el número ${view.ficha[1]}.`
          }${view.delivered ? ' El álbum está entregado.' : ''}`

  return <PixelCanvas label={description} draw={draw} />
}
