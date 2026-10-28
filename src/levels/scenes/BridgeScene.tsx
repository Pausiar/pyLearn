import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { BROKEN_BRIDGE, BRIDGES } from '../../engine/bridge'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  dither,
  disc,
  gradient,
  label,
  line,
  panel,
  rand,
  rect,
  speckle,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface BridgeAction {
  puente: string
  action: 'cruzado' | 'desvio' | 'cortado'
}

interface BridgeView {
  actions: BridgeAction[]
}

const RESTING: BridgeView = { actions: [] }

const BRIDGE_Y: Record<string, number> = { norte: 34, sur: 64, este: 94 }
const PLAQUE_X = 172

function stateOf(view: BridgeView, puente: string): BridgeAction['action'] | 'pendiente' {
  const events = view.actions.filter((event) => event.puente === puente)
  const last = events[events.length - 1]
  return last === undefined ? 'pendiente' : last.action
}

function drawSky(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 0, 224, 128, '#2a1e40', '#140f22', 8)
  starfield(context, 0, 0, 224, 70, '#e8def8', 11, 26, time, reduced)

  gradient(context, 0, 74, 224, 38, '#241a38', '#160f24', 5)
  dither(context, 0, 70, 224, 46, alpha(COLORS.ink, 0.14), 4)

  rect(context, 0, 112, 224, 16, '#1b2a4a')
  rect(context, 0, 112, 224, 1, '#2f4a7a')
  rect(context, 0, 113, 224, 2, '#24406a')
  if (!reduced) {
    for (let index = 0; index < 9; index += 1) {
      const drift = (time / 60 + index * 23) % 260
      const y = 115 + (index % 3) * 4
      context.globalAlpha = 0.25
      line(context, 30 + drift - 260, y, 44 + drift - 260, y, COLORS.ice)
      context.globalAlpha = 1
    }
  } else {
    for (let index = 0; index < 6; index += 1) {
      rect(context, 40 + index * 26, 116 + (index % 3) * 4, 8, 1, alpha(COLORS.ice, 0.2))
    }
  }
  rect(context, 0, 126, 224, 2, '#0e1730')
}

function drawCliff(
  context: CanvasRenderingContext2D,
  side: 'left' | 'right',
  time: number,
  reduced: boolean,
): void {
  for (let y = 0; y < 128; y += 4) {
    const wobble = Math.round(Math.sin(y / 17 + (side === 'left' ? 0 : 2)) * 4)
    const edge = side === 'left' ? 52 + wobble : 172 - wobble
    const x = side === 'left' ? 0 : edge
    const width = side === 'left' ? edge : 224 - edge
    rect(context, x, y, width, 4, '#2a1e38')
    rect(context, x, y, side === 'left' ? 8 : 8, 4, '#342646')
    if (side === 'left') {
      rect(context, edge - 5, y, 3, 4, '#3f2f52')
      rect(context, edge - 2, y, 2, 4, '#1b1428')
    } else {
      rect(context, x, y, 3, 4, '#3f2f52')
      rect(context, x + 3, y, 2, 4, '#1b1428')
    }
  }
  speckle(context, side === 'left' ? 4 : 180, 0, side === 'left' ? 42 : 40, 128, alpha(COLORS.ink, 0.35), side === 'left' ? 3 : 9, 26)
  dither(context, side === 'left' ? 4 : 178, 0, side === 'left' ? 40 : 42, 128, alpha(COLORS.ink, 0.12), 3)

  const pathX = side === 'left' ? 34 : 190
  if (side === 'left') {
    for (const y of [34, 64, 94]) {
      for (let step = 0; step < 4; step += 1) {
        rect(context, 44 + step * 3, y + 1, 2, 1, alpha(COLORS.sand, 0.35))
      }
    }
  }
  for (let y = 38; y < 94; y += 4) {
    rect(context, pathX, y, 2, 2, alpha(COLORS.sand, y % 8 === 0 ? 0.3 : 0.18))
  }

  if (side === 'left') {
    const grass = [8, 20, 28, 44]
    for (const x of grass) {
      rect(context, x, 0, 2, 4, '#1e4a3a')
      rect(context, x + 2, 2, 1, 2, '#1e4a3a')
    }
    rect(context, 2, 104, 40, 24, '#211a30')
    rect(context, 4, 104, 36, 1, '#3f2f52')

    rect(context, 8, 106, 20, 12, '#4a3a20')
    label(context, 'CAMPAMENTO', 18, 114, 3, '#d9b878', 'center')
    line(context, 10, 106, 18, 98, COLORS.sand)
    line(context, 27, 106, 18, 98, COLORS.sand)
    line(context, 18, 98, 18, 106, COLORS.sand)
    line(context, 10, 108, 18, 100, alpha(COLORS.paper, 0.15))

    const flicker = reduced ? 1 : 0.7 + 0.3 * Math.sin(time / 100)
    context.globalAlpha = flicker
    disc(context, 38, 118, 3, COLORS.orange)
    disc(context, 38, 117, 2, COLORS.gold)
    disc(context, 38, 116, 1, COLORS.cream)
    context.globalAlpha = flicker * 0.18
    disc(context, 38, 118, 8, COLORS.orange)
    context.globalAlpha = 1
    rect(context, 34, 121, 8, 2, '#4a2a20')
    rect(context, 35, 121, 6, 1, '#7d2f26')
    if (!reduced) {
      context.globalAlpha = 0.2
      rect(context, 37 + Math.round(Math.sin(time / 400) * 2), 110, 1, 3, COLORS.silver)
      rect(context, 39 + Math.round(Math.sin(time / 500 + 2) * 2), 104, 1, 4, COLORS.silver)
      context.globalAlpha = 1
    }
  } else {
    const tree = [188, 204]
    for (const x of tree) {
      rect(context, x, 20, 2, 18, '#1b1428')
      disc(context, x + 1, 18, 6, '#241a34')
      disc(context, x + 6, 21, 4, '#1b1428')
    }
    rect(context, 180, 96, 40, 32, '#241a34')
    rect(context, 182, 96, 36, 1, '#3f2f52')

    rect(context, 196, 106, 2, 12, '#6a5540')
    panel(context, 186, 98, 24, 10, '#d9b878', '#8a6a3a')
    label(context, 'SALIDA', 198, 105, 4, '#3c3026', 'center')
    rect(context, 198, 108, 1, 10, alpha(COLORS.ink, 0.2))

    for (let index = 0; index < 3; index += 1) {
      rect(context, 182 + index * 7, 120, 5, 4, '#3a2a4a')
      rect(context, 183 + index * 7, 120, 3, 1, '#4a3a5c')
    }
  }
}

function drawBridgeSpan(
  context: CanvasRenderingContext2D,
  puente: string,
  state: BridgeAction['action'] | 'pendiente',
  time: number,
  reduced: boolean,
): void {
  const y = BRIDGE_Y[puente] ?? 64
  const broken = puente === BROKEN_BRIDGE
  const trim =
    state === 'cruzado' ? COLORS.lime : broken ? COLORS.coral : state === 'desvio' ? COLORS.gold : '#6a5a88'

  rect(context, 52, y, 120, 6, '#6b4423')
  rect(context, 52, y, 120, 1, '#a86a3a')
  rect(context, 52, y + 5, 120, 1, '#3a2414')

  if (broken) {
    rect(context, 52, y, 44, 6, '#6b4423')
    rect(context, 128, y, 44, 6, '#6b4423')
    rect(context, 52, y, 44, 1, '#a86a3a')
    rect(context, 128, y, 44, 1, '#a86a3a')
    line(context, 96, y + 2, 88, y + 12, '#8a5a2b')
    line(context, 98, y + 2, 103, y + 14, '#6b4423')
    line(context, 127, y + 2, 121, y + 13, '#8a5a2b')
    line(context, 129, y + 2, 134, y + 10, '#6b4423')
    line(context, 84, y - 8, 96, y, '#5a4a6a')
    line(context, 136, y - 8, 128, y, '#5a4a6a')
    const pulse = reduced ? 0.7 : 0.5 + 0.3 * Math.sin(time / 220)
    context.globalAlpha = pulse
    rect(context, 96, y + 2, 4, 2, COLORS.coral)
    rect(context, 128, y + 2, 4, 2, COLORS.coral)
    context.globalAlpha = 1
    context.globalAlpha = 0.3
    rect(context, 98, y + 8, 26, 2, COLORS.coral)
    context.globalAlpha = 1
  } else {
    for (let x = 56; x < 168; x += 8) {
      rect(context, x, y + 1, 1, 4, alpha(COLORS.ink, 0.28))
      rect(context, x + 1, y + 1, 6, 1, alpha(COLORS.cream, 0.12))
    }
  }

  rect(context, 54, y - 12, 4, 18, '#4a3a5c')
  rect(context, 54, y - 12, 1, 18, '#6a5a88')
  rect(context, 166, y - 12, 4, 18, '#4a3a5c')
  rect(context, 166, y - 12, 1, 18, '#6a5a88')
  line(context, 57, y - 11, 112, y - 6, '#8a7a9c')
  line(context, 112, y - 6, 167, y - 11, '#8a7a9c')
  rect(context, 55, y - 14, 2, 2, trim)
  rect(context, 167, y - 14, 2, 2, trim)

  rect(context, 52, y + 6, 120, 2, alpha(COLORS.ink, 0.4))
  rect(context, 52, y + 8, 4, 5, '#3a2a4a')
  rect(context, 168, y + 8, 4, 5, '#3a2a4a')
}

function drawWagon(
  context: CanvasRenderingContext2D,
  x: number,
  bottom: number,
  alert: boolean,
  final: boolean,
  time: number,
  reduced: boolean,
): void {
  rect(context, x + 2, bottom - 1, 28, 1, alpha(COLORS.ink, 0.5))
  disc(context, x + 7, bottom - 2, 4, '#3a2414')
  disc(context, x + 7, bottom - 2, 2, '#6b4423')
  disc(context, x + 23, bottom - 2, 4, '#3a2414')
  disc(context, x + 23, bottom - 2, 2, '#6b4423')
  rect(context, x + 7, bottom - 3, 1, 1, COLORS.silver)
  rect(context, x + 23, bottom - 3, 1, 1, COLORS.silver)

  bevel(context, x + 2, bottom - 15, 26, 11, '#8a5a2b', '#b07a3f', '#5c3a1c', COLORS.ink)
  rect(context, x + 4, bottom - 20, 22, 6, '#e8dcc0')
  rect(context, x + 5, bottom - 22, 20, 2, '#d9cdb0')
  rect(context, x + 8, bottom - 23, 14, 1, '#efe6cc')
  rect(context, x + 6, bottom - 19, 18, 1, alpha(COLORS.woodDark, 0.35))
  rect(context, x + 10, bottom - 18, 10, 1, alpha(COLORS.woodDark, 0.25))
  rect(context, x + 2, bottom - 16, 2, 9, '#5c3a1c')
  rect(context, x + 26, bottom - 16, 2, 9, '#5c3a1c')

  disc(context, x + 25, bottom - 12, 1, COLORS.gold)
  rect(context, x + 27, bottom - 16, 1, 6, '#5c3a1c')
  if (!reduced) {
    context.globalAlpha = 0.3
    disc(context, x + 28, bottom - 17, 2, COLORS.cream)
    context.globalAlpha = 1
  }

  rect(context, x + 4, bottom - 11, 22, 2, alpha(COLORS.ink, 0.18))

  if (alert) {
    const pulse = reduced ? 1 : 0.8 + 0.2 * Math.sin(time / 200)
    context.globalAlpha = pulse
    panel(context, x + 20, bottom - 18, 12, 10, '#efe0c2', COLORS.brickDark)
    label(context, '!', x + 26, bottom - 10, 8, COLORS.brickDark, 'center')
    context.globalAlpha = 1
  }

  if (final) {
    const pulse = reduced ? 0.6 : 0.35 + 0.25 * Math.sin(time / 240)
    context.globalAlpha = pulse
    disc(context, x + 16, bottom - 10, 9, alpha(COLORS.gold, 0.35))
    context.globalAlpha = 1
    drawSprite(context, SPRITES.check, x + 21, bottom - 20, { scale: 1, palette: { g: COLORS.gold } })
  }
}

function drawCaravan(
  context: CanvasRenderingContext2D,
  view: BridgeView,
  time: number,
  reduced: boolean,
): void {
  const last = view.actions[view.actions.length - 1]
  if (last === undefined) {
    drawWagon(context, 14, 34, false, false, time, reduced)
    rect(context, 10, 35, 40, 1, alpha(COLORS.sand, 0.25))
    return
  }

  if (last.action === 'cruzado' && last.puente === 'norte') {
    drawWagon(context, 132, 34, false, false, time, reduced)
    return
  }
  if (last.action === 'cortado') {
    drawWagon(context, 64, 64, true, false, time, reduced)
    return
  }
  if (last.action === 'desvio') {
    drawWagon(context, 18, 78, false, false, time, reduced)
    rect(context, 14, 79, 40, 1, alpha(COLORS.sand, 0.25))
    return
  }
  if (last.action === 'cruzado' && last.puente === 'este') {
    drawWagon(context, 130, 94, false, true, time, reduced)
    return
  }
  drawWagon(context, 14, 34, false, false, time, reduced)
}

function drawPlaque(
  context: CanvasRenderingContext2D,
  puente: string,
  state: BridgeAction['action'] | 'pendiente',
  time: number,
  reduced: boolean,
): void {
  const y = (BRIDGE_Y[puente] ?? 64) - 17
  const colour =
    state === 'cruzado'
      ? COLORS.lime
      : state === 'cortado'
        ? COLORS.coral
        : state === 'desvio'
          ? COLORS.gold
          : '#4a3a6a'
  panel(context, PLAQUE_X, y, 46, 14, 'rgba(20,15,34,0.92)', colour)
  label(context, puente.toUpperCase(), PLAQUE_X + 4, y + 7, 5, state === 'pendiente' ? '#a08fbe' : COLORS.paper)
  label(
    context,
    state === 'pendiente' ? 'SIN PASAR' : state.toUpperCase(),
    PLAQUE_X + 4,
    y + 13,
    4,
    state === 'pendiente' ? '#8a7aaa' : colour,
  )
  if (state === 'cruzado') {
    drawSprite(context, SPRITES.check, PLAQUE_X + 37, y + 2, { scale: 1, palette: { g: COLORS.lime } })
  } else if (state === 'cortado') {
    drawSprite(context, SPRITES.cross, PLAQUE_X + 37, y + 2, { scale: 1 })
  } else if (state === 'desvio') {
    const pulse = reduced ? 0.8 : 0.55 + 0.3 * Math.sin(time / 260)
    context.globalAlpha = pulse
    label(context, '→', PLAQUE_X + 39, y + 8, 7, COLORS.gold, 'center')
    context.globalAlpha = 1
  }
}

function drawBridgeScene(
  context: CanvasRenderingContext2D,
  view: BridgeView,
  time: number,
  reduced: boolean,
): void {
  drawSky(context, time, reduced)
  drawCliff(context, 'left', time, reduced)
  drawCliff(context, 'right', time, reduced)

  rect(context, 56, 100, 112, 3, alpha(COLORS.ice, 0.06))
  rect(context, 56, 92, 112, 2, alpha(COLORS.ice, 0.04))

  BRIDGES.forEach((puente) => {
    drawBridgeSpan(context, puente, stateOf(view, puente), time, reduced)
  })

  if (stateOf(view, BROKEN_BRIDGE) === 'pendiente') {
    panel(context, 100, 48, 34, 8, '#efe0c2', COLORS.brickDark)
    label(context, 'CORTADO', 117, 54, 4, COLORS.brickDark, 'center')
  }

  BRIDGES.forEach((puente) => {
    drawPlaque(context, puente, stateOf(view, puente), time, reduced)
  })

  drawCaravan(context, view, time, reduced)

  const last = view.actions[view.actions.length - 1]
  const final = last?.action === 'cruzado' && last.puente === 'este'

  if (!final) {
    panel(context, 100, 4, 120, 14, 'rgba(20,15,34,0.92)', '#4a3a6a')
    label(context, 'LA CARAVANA', 105, 11, 5, COLORS.violet)
    label(context, `${view.actions.length} PASOS`, 214, 11, 4, '#a08fbe', 'right')
    label(
      context,
      last === undefined
        ? 'espera en la orilla'
        : last.action === 'cruzado'
          ? `Cruzado: ${last.puente}`
          : last.action === 'desvio'
            ? `Desvío: ${last.puente}`
            : `Cortado: ${last.puente}`,
      105,
      16,
      4,
      last === undefined ? '#a08fbe' : last.action === 'cortado' ? COLORS.coral : last.action === 'desvio' ? COLORS.gold : COLORS.lime,
    )
  }

  if (final) {
    const pulse = reduced ? 1 : 0.8 + 0.2 * Math.sin(time / 300)
    context.globalAlpha = pulse
    panel(context, 104, 4, 112, 13, 'rgba(47,107,58,0.94)', COLORS.lime)
    drawSprite(context, SPRITES.check, 107, 6, { scale: 1, palette: { g: COLORS.lime } })
    label(context, 'RUTA COMPLETADA', 160, 13, 6, COLORS.cream, 'center')
    context.globalAlpha = 1
    for (let index = 0; index < 12; index += 1) {
      const progress = reduced ? 0.5 : (time / 1600 + index / 12) % 1
      context.globalAlpha = 0.7 * (1 - progress)
      rect(
        context,
        Math.round(108 + rand(index + 15) * 100),
        Math.round(22 - progress * 16),
        1,
        2,
        index % 2 === 0 ? COLORS.gold : COLORS.lime,
      )
    }
    context.globalAlpha = 1
  }

  speckle(context, 0, 0, 224, 128, alpha(COLORS.paper, 0.04), 41, 18)

  if (!reduced) {
    const mist = (time / 100) % 260
    context.globalAlpha = 0.07
    for (let index = 0; index < 3; index += 1) {
      rect(context, Math.round(((mist + index * 70) % 260) - 40), 104 + index * 2, 52, 2, COLORS.ice)
    }
    context.globalAlpha = 1
  }
}

/** Lienzo de la ruta: los tres puentes, el corte y la caravana abriéndose paso. */
export function BridgeScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<BridgeView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawBridgeScene(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'bridge') continue
      setView({ actions: step.actions })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 340)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const last = view.actions[view.actions.length - 1]
  const description =
    last === undefined
      ? 'La caravana espera en la orilla: los puentes norte, sur y este siguen por cruzar.'
      : `La caravana lleva ${view.actions.length} pasos. Último aviso: ${
          last.action === 'cruzado' ? 'cruzado' : last.action === 'desvio' ? 'desvío' : 'cortado'
        } ${last.puente}.`

  return <PixelCanvas label={description} draw={draw} />
}
