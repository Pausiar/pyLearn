import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { CROP_COUNT } from '../../engine/irrigation'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bar,
  disc,
  glow,
  gradient,
  label,
  line,
  panel,
  rect,
  speckle,
} from '../../pixel/shapes'

interface IrrigationView {
  watered: number[]
  position: number
}

const RESTING: IrrigationView = { watered: [], position: 0 }

/** Cien cultivos en una cuadrícula de 20 columnas por 5 filas. */
const COLS = 20
const CELL_W = 9.8
const CELL_H = 15
const ORIGIN_X = 18
const ORIGIN_Y = 28

function cellCentre(crop: number): { x: number; y: number } {
  const index = Math.min(Math.max(crop, 1), CROP_COUNT) - 1
  return {
    x: ORIGIN_X + (index % COLS) * CELL_W + CELL_W / 2,
    y: ORIGIN_Y + Math.floor(index / COLS) * CELL_H,
  }
}

function drawHorizon(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  gradient(context, 0, 0, 224, 30, '#2a1a3a', '#c9794f', 8)
  glow(context, 190, 15, 16, COLORS.orange, 0.22)
  disc(context, 190, 15, 8, '#ffcf7a')
  disc(context, 190, 15, 6, '#ffe6a8')

  // Colinas y arboledas lejanas.
  for (let index = 0; index < 5; index += 1) {
    disc(context, 20 + index * 52, 30, 15 + (index % 2) * 5, index % 2 === 0 ? '#4a3326' : '#3c2a20')
  }
  for (const treeX of [44, 62, 116, 142]) {
    rect(context, treeX, 22, 1, 6, '#3a2a1e')
    disc(context, treeX, 21, 4, '#3e4a2a')
    disc(context, treeX + 2, 19, 3, '#4a5a32')
  }

  // Molino de viento con aspas girando.
  rect(context, 24, 12, 8, 16, '#6a5440')
  rect(context, 24, 12, 8, 1, '#8a7058')
  rect(context, 22, 27, 12, 2, '#4a382a')
  disc(context, 28, 12, 2, '#3a2a1e')
  for (let blade = 0; blade < 4; blade += 1) {
    const angle = (reduced ? 0.4 : time / 900) + (blade * Math.PI) / 2
    const x = Math.round(28 + Math.cos(angle) * 8)
    const y = Math.round(12 + Math.sin(angle) * 8)
    line(context, 28, 12, x, y, alpha(COLORS.cream, 0.8))
    rect(context, x - 1, y - 1, 2, 2, COLORS.cream)
  }

  // Granero junto al sol.
  disc(context, 28, 28, 14, '#4a3326')
  rect(context, 154, 18, 14, 10, '#6a3a2a')
  rect(context, 153, 17, 16, 2, '#8a4a34')
  rect(context, 154, 18, 14, 1, '#a85a3e')
  rect(context, 159, 22, 4, 6, '#3a2018')
}

function drawField(context: CanvasRenderingContext2D, view: IrrigationView, time: number, reduced: boolean): void {
  rect(context, 0, 30, 224, 80, '#2f2317')
  gradient(context, 0, 30, 224, 78, '#3a2c1d', '#291f14', 6)
  speckle(context, 0, 30, 224, 78, alpha('#8a6a46', 0.16), 41, 52)

  // Canal de riego a la izquierda, con compuertas por fila.
  rect(context, 4, 30, 12, 78, '#4a3a28')
  rect(context, 5, 30, 10, 78, '#24708a')
  rect(context, 6, 30, 8, 78, '#2a7f96')
  for (let y = 32; y < 106; y += 5) {
    const offset = reduced ? 0 : Math.round(Math.sin(time / 420 + y) * 1)
    rect(context, 7 + offset, y, 5, 1, alpha(COLORS.ice, 0.5))
  }
  rect(context, 3, 30, 1, 78, '#7a6248')
  rect(context, 15, 30, 1, 78, '#7a6248')
  rect(context, 16, 30, 2, 78, '#46351f')
  for (let row = 0; row < 5; row += 1) {
    const y = ORIGIN_Y + row * CELL_H + 5
    rect(context, 15, y, 4, 4, '#7a6248')
    rect(context, 16, y + 1, 3, 1, COLORS.water)
    rect(context, 17, y + 2, 2, 2, alpha(COLORS.cyan, 0.8))
  }

  // Valla del borde superior del campo.
  rect(context, 16, 24, 202, 1, '#6a5440')
  rect(context, 16, 27, 202, 1, '#4a382a')
  for (let x = 18; x < 220; x += 16) {
    rect(context, x, 22, 2, 7, '#7a6248')
    rect(context, x, 22, 2, 1, '#9a7a58')
  }

  // Surcos: cinco franjas de tierra con sus plantas.
  for (let row = 0; row < 5; row += 1) {
    const rowY = ORIGIN_Y + row * CELL_H
    rect(context, ORIGIN_X, rowY, COLS * CELL_W, 13, row % 2 === 0 ? '#4a3826' : '#443320')
    rect(context, ORIGIN_X, rowY, COLS * CELL_W, 1, '#5e4a30')
    rect(context, ORIGIN_X, rowY + 12, COLS * CELL_W, 1, '#2a2016')
    for (let col = 0; col < COLS; col += 1) {
      rect(context, ORIGIN_X + col * CELL_W, rowY + 1, 1, 11, alpha('#2a2016', 0.25))
    }
  }

  const watered = new Set(view.watered)
  for (let crop = 1; crop <= CROP_COUNT; crop += 1) {
    const index = crop - 1
    const x = ORIGIN_X + (index % COLS) * CELL_W
    const y = ORIGIN_Y + Math.floor(index / COLS) * CELL_H
    const done = watered.has(crop)
    const fresh = done && crop === view.position

    // Reguero de tierra removida alrededor del tallo.
    rect(context, x + 2, y + 11, 5, 1, done ? '#2c2416' : '#34281a')
    rect(context, x + 4, y + 6, 1, 5, done ? '#2f7a3c' : '#8a7448')
    if (done) {
      rect(context, x + 2, y + 7, 2, 1, '#4ce07a')
      rect(context, x + 6, y + 8, 2, 1, '#4ce07a')
      rect(context, x + 3, y + 5, 2, 1, '#8af09a')
      rect(context, x + 6, y + 4, 1, 2, '#3ab06a')
      rect(context, x + 3, y + 9, 1, 1, alpha(COLORS.sky, 0.65))
      if (fresh) {
        rect(context, x + 4, y + 4, 1, 1, COLORS.gold)
        glow(context, x + 5, y + 8, 7, COLORS.lime, 0.16)
      } else if (index % 3 === 0) {
        rect(context, x + 2, y + 4, 1, 1, COLORS.gold)
      }
    } else {
      rect(context, x + 2, y + 8, 2, 1, '#b8a06a')
      rect(context, x + 6, y + 7, 2, 1, '#b8a06a')
      rect(context, x + 3, y + 6, 1, 1, '#d0bc88')
      rect(context, x + 3, y + 4, 1, 1, '#c8b47e')
    }
  }
}

function drawDrone(
  context: CanvasRenderingContext2D,
  view: IrrigationView,
  time: number,
  reduced: boolean,
): void {
  if (view.position < 1) return
  const { x, y } = cellCentre(view.position)
  const bob = reduced ? 0 : Math.sin(time / 260) * 1.2
  const dy = Math.round(y - 5 + bob)
  const cx = Math.round(x)

  context.globalAlpha = 0.28
  disc(context, cx, y + 12, 5, COLORS.ink)
  context.globalAlpha = 1

  // Caudal de agua sobre el cultivo recién regado.
  const spray = view.watered.includes(view.position)
  if (spray) {
    for (let drop = 0; drop < 3; drop += 1) {
      const phase = reduced ? 0.4 : (time / 520 + drop / 3) % 1
      const dx = cx - 2 + Math.round(Math.sin(drop * 2 + phase * 6) * 3)
      const dripY = dy + 6 + Math.round(phase * 7)
      rect(context, dx, dripY, 1, 2, alpha(COLORS.sky, 0.85))
    }
  }

  // Aspas.
  const blur = reduced ? 0 : Math.round(Math.sin(time / 90) * 1)
  rect(context, cx - 7, dy + 1, 14, 1, '#5a6a80')
  rect(context, cx - 9, dy, 4, 1, '#9ab8d8')
  rect(context, cx + 6, dy + blur, 4, 1, '#9ab8d8')
  rect(context, cx - 10, dy + 1, 1, 1, '#d8ecff')
  rect(context, cx + 9, dy + 1 - blur, 1, 1, '#d8ecff')

  // Cuerpo y cámara.
  rect(context, cx - 5, dy + 2, 10, 4, '#3a4a60')
  rect(context, cx - 5, dy + 2, 10, 1, '#7a90aa')
  rect(context, cx - 4, dy + 3, 8, 1, '#8ad0ff')
  rect(context, cx - 1, dy + 6, 3, 2, '#2a3648')
  rect(context, cx, dy + 7, 1, 1, COLORS.gold)
  rect(context, cx - 5, dy + 6, 1, 2, '#2a3648')
  rect(context, cx + 4, dy + 6, 1, 2, '#2a3648')
  glow(context, cx, dy + 4, 8, COLORS.sky, 0.12)
}

/** Lienzo del campo grande: cuántos cultivos van regados de los cien. */
export function IrrigationScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<IrrigationView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      const complete = view.watered.length === CROP_COUNT

      drawHorizon(context, time, reduced)
      drawField(context, view, time, reduced)
      drawDrone(context, view, time, reduced)

      panel(context, 6, 109, 212, 14, 'rgba(18,24,16,0.94)', complete ? COLORS.green : '#5a6a3a')
      label(context, `REGADOS ${view.watered.length}/${CROP_COUNT}`, 12, 118, 6, complete ? COLORS.lime : COLORS.cream)
      bar(
        context,
        92,
        113,
        72,
        4,
        view.watered.length / CROP_COUNT,
        complete ? COLORS.lime : COLORS.moss,
        alpha(COLORS.paper, 0.14),
      )
      const status = complete
        ? '¡CAMPO LISTO!'
        : view.watered.length === 0
          ? 'dron en el hangar'
          : `dron en ${view.position}`
      label(context, status, 209, 118, 5, complete ? COLORS.lime : '#a8b89a', 'right')
      disc(context, 214, 116, 2, complete ? COLORS.lime : view.watered.length > 0 ? COLORS.moss : '#5a6a3a')
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'irrigation') continue
      setView({ watered: step.watered, position: step.position })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 170)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.watered.length === 0
      ? `El campo tiene ${CROP_COUNT} cultivos y el dron espera en el hangar.`
      : `Cultivos regados: ${view.watered.length} de ${CROP_COUNT}. El dron está en la casilla ${view.position}.`

  return <PixelCanvas label={description} draw={draw} />
}
