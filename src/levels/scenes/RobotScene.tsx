import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { HURDLES, TRACK_END } from '../../engine/robot'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2
const START_X = 16
const STEP = 20

interface RobotView {
  position: number
  jumps: number
  taught: boolean
  run: boolean
}

function cellX(cell: number): number {
  return START_X + cell * STEP
}

function drawRobot(context: CanvasRenderingContext2D, view: RobotView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#131a29')
  rect(context, 0, 96, WIDTH, 32, '#20263a')
  rect(context, 0, 96, WIDTH, 3, '#2f3850')

  HURDLES.forEach((cell) => {
    const x = cellX(cell)
    rect(context, x - 9, 68, 3, 28, '#8a5a2b')
    rect(context, x + 6, 68, 3, 28, '#8a5a2b')
    rect(context, x - 11, 68, 22, 4, '#e05263')
    rect(context, x - 11, 80, 22, 3, '#e05263')
  })

  const meta = cellX(TRACK_END)
  rect(context, meta, 52, 3, 44, '#9aa8c2')
  rect(context, meta + 3, 52, 14, 9, '#30d158')

  const x = cellX(view.position)
  rect(context, x - 7, 72, 14, 24, '#4aa8ff')
  rect(context, x - 5, 62, 10, 10, '#c9d4e4')
  rect(context, x - 3, 65, 2, 3, '#1b1f3b')
  rect(context, x + 1, 65, 2, 3, '#1b1f3b')
  rect(context, x - 2, 84, 4, 4, '#1b1f3b')

  label(context, 'PISTA DE VALLAS', 10, 16, 8, '#9aa8c2')
  label(context, `Vallas: ${view.jumps}/${HURDLES.length}`, 10, 32, 9, '#e8f1ff')
  label(
    context,
    view.run ? 'El robot corre' : view.taught ? 'Truco aprendido' : 'Sin truco',
    10,
    46,
    8,
    view.taught ? '#8fd3a6' : '#7f8db8',
  )
  label(
    context,
    view.position >= TRACK_END ? '¡En la meta!' : `Casilla ${view.position} de ${TRACK_END}`,
    WIDTH - 10,
    16,
    8,
    view.position >= TRACK_END ? '#8de08f' : '#9aa8c2',
    'right',
  )
}

/** Lienzo del robot: la pista, las tres vallas y el truco que aprende. */
export function RobotScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<RobotView>({ position: 0, jumps: 0, taught: false, run: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawRobot(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'robot') continue
      if (!aliveRef.current) return
      setView({
        position: step.position,
        jumps: step.jumps,
        taught: step.taught,
        run: step.run,
      })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ position: 0, jumps: 0, taught: false, run: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.position >= TRACK_END
      ? 'El robot ha cruzado las tres vallas y está en la meta.'
      : `El robot está en la casilla ${view.position} de ${TRACK_END}, ha saltado ${view.jumps} de ${HURDLES.length} vallas y ${view.taught ? 'ya sabe el truco' : 'todavía no sabe el truco'}.`

  return (
    <div className="field">
      <canvas
        ref={canvasRef}
        className="field__canvas field__canvas--smooth"
        width={WIDTH * SCALE}
        height={HEIGHT * SCALE}
        role="img"
        aria-label={description}
      />
      <p className="field__caption" aria-hidden="true">
        {description}
      </p>
    </div>
  )
}
