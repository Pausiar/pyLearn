import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react'
import { HURDLES, TRACK_END } from '../../engine/robot'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS, THEMES } from '../../pixel/palette'
import {
  alpha,
  cloud,
  disc,
  dither,
  glow,
  gradient,
  groundTexture,
  hills,
  label,
  panel,
  rand,
  rect,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

const THEME = THEMES[5]
const START_X = 22
const STEP = 20
const ROBOT_Y = 68

const cellX = (cell: number): number => START_X + cell * STEP

interface RobotView {
  position: number
  jumps: number
  taught: boolean
  run: boolean
}

function drawHurdle(context: CanvasRenderingContext2D, cell: number): void {
  const x = cellX(cell)
  dither(context, x - 12, 94, 26, 6, alpha(COLORS.ink, 0.3), 2)

  rect(context, x - 10, 70, 2, 30, COLORS.silver)
  rect(context, x + 8, 70, 2, 30, COLORS.silver)
  rect(context, x - 10, 70, 2, 1, COLORS.paper)
  rect(context, x + 8, 70, 2, 1, COLORS.paper)
  rect(context, x - 11, 98, 5, 2, COLORS.steel)
  rect(context, x + 7, 98, 5, 2, COLORS.steel)

  rect(context, x - 12, 68, 24, 4, COLORS.paper)
  rect(context, x - 12, 80, 24, 4, COLORS.paper)
  for (let offset = 0; offset < 24; offset += 8) {
    rect(context, x - 12 + offset, 68, 4, 4, COLORS.red)
    rect(context, x - 12 + offset + 4, 80, 4, 4, COLORS.red)
  }
}

function drawFinish(context: CanvasRenderingContext2D): void {
  const finish = cellX(TRACK_END)

  rect(context, finish + 15, 44, 2, 58, COLORS.silver)
  rect(context, finish + 15, 44, 1, 58, COLORS.paper)
  rect(context, finish + 13, 100, 6, 2, COLORS.steel)
  disc(context, finish + 16, 43, 2, COLORS.gold)
  rect(context, finish + 15, 42, 1, 1, COLORS.cream)

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      rect(
        context,
        finish - 1 + col * 4,
        45 + row * 3,
        4,
        3,
        (row + col) % 2 === 0 ? COLORS.ink : COLORS.paper,
      )
    }
  }
  rect(context, finish - 1, 54, 16, 1, alpha(COLORS.ink, 0.35))

  panel(context, finish - 6, 56, 24, 8, 'rgba(20,16,30,0.78)', '#6a5548')
  label(context, 'META', finish + 6, 62, 5, COLORS.gold, 'center')
}

function drawScene(
  context: CanvasRenderingContext2D,
  view: RobotView,
  cell: number,
  hop: number,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 96, THEME.skyTop, THEME.skyBottom, 10)
  starfield(context, 0, 0, 224, 32, COLORS.ice, 43, 10, time, reduced)
  cloud(context, 20, 22, 30, '#6a5a7a', '#54466a')
  cloud(context, 96, 14, 22, '#6a5a7a', '#54466a')
  glow(context, 176, 52, 26, COLORS.gold, 0.34)
  disc(context, 176, 52, 10, COLORS.gold)
  disc(context, 173, 49, 6, COLORS.cream)
  hills(context, 88, 16, THEME.silhouette, 17)
  hills(context, 94, 9, '#3a2c38', 31, 3)

  rect(context, 0, 88, 224, 2, '#3a3040')
  for (let x = 0; x < 224; x += 10) rect(context, x, 90, 2, 7, '#2a2430')

  groundTexture(context, 0, 96, 224, 32, '#8a4a3a', '#a85a48', '#5c3028', 47)
  rect(context, 0, 96, 224, 1, '#b06a50')
  rect(context, 0, 124, 224, 1, alpha(COLORS.ink, 0.25))
  for (let y = 99; y < 128; y += 4) rect(context, 12, y, 2, 2, alpha(COLORS.paper, 0.3))

  drawFinish(context)
  HURDLES.forEach((cellNumber) => drawHurdle(context, cellNumber))

  const x = cellX(cell)
  context.globalAlpha = Math.max(0.12, 0.4 - hop * 0.02)
  rect(context, x - 8, 99, 16, 2, COLORS.ink)
  context.globalAlpha = 1

  if (view.run) glow(context, x, ROBOT_Y + 10 - hop, 14, COLORS.cyan, 0.14)
  drawSprite(context, SPRITES.robot, x - 12, ROBOT_Y - hop, {
    scale: 2,
    outline: COLORS.ink,
  })

  if (!reduced && hop > 1) {
    for (let index = 0; index < 3; index += 1) {
      const px = x - 10 + Math.round((time / 40 + index * 9) % 20)
      rect(context, px, 96 - index, 1, 1, alpha(COLORS.sand, 0.5))
    }
  }

  panel(context, 6, 6, 110, 48, 'rgba(20,16,30,0.84)', '#5a4a5c')
  label(context, 'PISTA DE VALLAS', 12, 18, 7, COLORS.paper)
  label(context, `Casilla ${view.position} de ${TRACK_END}`, 12, 30, 6, THEME.muted)
  label(context, `Vallas ${view.jumps}/${HURDLES.length}`, 12, 40, 6, THEME.muted)
  label(
    context,
    view.taught ? 'truco aprendido' : 'sin truco todavía',
    12,
    50,
    6,
    view.taught ? COLORS.lime : THEME.muted,
  )

  const meta = view.position >= TRACK_END
  panel(
    context,
    122,
    6,
    96,
    meta ? 32 : 38,
    meta ? 'rgba(24,50,34,0.9)' : 'rgba(10,20,26,0.86)',
    meta ? COLORS.green : view.taught ? COLORS.teal : '#3a3444',
  )
  if (meta) {
    label(context, '¡EN LA META!', 170, 20, 8, COLORS.lime, 'center')
    label(context, `${HURDLES.length} de ${HURDLES.length} vallas`, 170, 31, 6, '#bdf0c4', 'center')
  } else if (view.taught) {
    label(context, 'TRUCO APRENDIDO', 126, 16, 6, COLORS.lime)
    label(context, 'def saltar_valla():', 126, 26, 5, COLORS.ice)
    label(context, '  avanzar()', 126, 33, 5, COLORS.ice)
    label(context, '  saltar()', 126, 40, 5, COLORS.ice)
  } else {
    label(context, 'SIN TRUCO', 126, 16, 6, THEME.muted)
    label(context, 'el robot espera', 126, 27, 5, THEME.muted)
    label(context, 'una función', 126, 34, 5, THEME.muted)
  }

  if (meta) {
    for (let index = 0; index < 10; index += 1) {
      const progress = reduced ? 0.5 : ((time / 1200 + index / 10) % 1)
      const px = Math.round(150 + rand(index + 13) * 70)
      const py = Math.round(6 - progress * 4 + rand(index + 29) * 26)
      context.globalAlpha = 0.9 * (1 - progress * 0.5)
      rect(context, px, py, 1, 2, index % 2 === 0 ? COLORS.gold : COLORS.lime)
    }
    context.globalAlpha = 1
  }
}

/** Lienzo de la pista: el robot salta las vallas con el truco que le enseñan. */
export function RobotScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<RobotView>({
    position: 0,
    jumps: 0,
    taught: false,
    run: false,
  })
  const cellRef = useRef(0)
  const targetRef = useRef(0)
  const hopRef = useRef({ start: -1000, amplitude: 0 })

  useEffect(() => {
    const travel = Math.abs(view.position - targetRef.current)
    targetRef.current = view.position
    if (travel > 0) {
      hopRef.current = {
        start: performance.now(),
        amplitude: travel >= 2 ? 15 : 4,
      }
    }
  }, [view.position])

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      if (reduced) {
        cellRef.current = view.position
      } else {
        cellRef.current += (view.position - cellRef.current) * 0.24
        if (Math.abs(view.position - cellRef.current) < 0.01) {
          cellRef.current = view.position
        }
      }
      const elapsed = time - hopRef.current.start
      const hop =
        reduced || elapsed > 320 || elapsed < 0
          ? 0
          : Math.sin((elapsed / 320) * Math.PI) * hopRef.current.amplitude
      drawScene(context, view, cellRef.current, hop, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'robot') continue
      setView({
        position: step.position,
        jumps: step.jumps,
        taught: step.taught,
        run: step.run,
      })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 340)
      })
    }
  }, [])

  const reset = useCallback(() => {
    cellRef.current = 0
    targetRef.current = 0
    hopRef.current = { start: -1000, amplitude: 0 }
    setView({ position: 0, jumps: 0, taught: false, run: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.position >= TRACK_END
      ? 'El robot ha cruzado las tres vallas y está en la meta.'
      : `El robot está en la casilla ${view.position} de ${TRACK_END}, ha saltado ${view.jumps} de ${HURDLES.length} vallas y ${view.taught ? 'ya sabe el truco' : 'todavía no sabe el truco'}.`

  return <PixelCanvas label={description} draw={draw} />
}
