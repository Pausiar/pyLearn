import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { CROP_COUNT } from '../../engine/irrigation'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

/** El campo grande, en cuadrícula: 10 filas de 10 cultivos. */
const GRID = 10
const CELL = 11
const ORIGIN_X = 6
const ORIGIN_Y = 8

interface IrrigationView {
  watered: number[]
  position: number
}

function cellAt(crop: number): { x: number; y: number } {
  const index = Math.min(Math.max(crop, 1), CROP_COUNT) - 1
  return {
    x: ORIGIN_X + (index % GRID) * CELL,
    y: ORIGIN_Y + Math.floor(index / GRID) * CELL,
  }
}

function drawIrrigation(context: CanvasRenderingContext2D, view: IrrigationView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#15251a')
  rect(context, ORIGIN_X - 2, ORIGIN_Y - 2, GRID * CELL + 2, GRID * CELL + 2, '#1f3a28')

  for (let index = 0; index < CROP_COUNT; index += 1) {
    const x = ORIGIN_X + (index % GRID) * CELL
    const y = ORIGIN_Y + Math.floor(index / GRID) * CELL
    const regado = view.watered.includes(index + 1)
    rect(context, x, y, CELL - 1, CELL - 1, regado ? '#3fb34f' : '#4a3a2a')
    if (regado) rect(context, x + 3, y + 3, 4, 4, '#9ce8a2')
  }

  if (view.position >= 1) {
    const { x, y } = cellAt(view.position)
    rect(context, x + 1, y + 1, CELL - 3, CELL - 3, '#4aa8ff')
  }

  const panelX = ORIGIN_X + GRID * CELL + 12
  const panelWidth = WIDTH - panelX - 8
  rect(context, panelX, 12, panelWidth, 52, '#1f3a28')

  label(context, 'CULTIVOS', panelX + 8, 30, 8, '#9fd7a8')
  label(context, `${view.watered.length} / ${CROP_COUNT}`, panelX + 8, 50, 17, '#eaf7ee')
  rect(context, panelX + 8, 56, panelWidth - 16, 4, '#2c4a35')
  rect(
    context,
    panelX + 8,
    56,
    Math.round(((panelWidth - 16) * view.watered.length) / CROP_COUNT),
    4,
    '#4caf50',
  )

  label(context, `Dron en la casilla ${view.position}`, 8, 124, 8, '#7fa88a')
  label(context, 'RIEGO EN BUCLE', WIDTH - 8, 124, 8, '#7fa88a', 'right')
}

/** Lienzo del campo grande: cuántos cultivos van regados de los cien. */
export function IrrigationScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<IrrigationView>({ watered: [], position: 0 })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawIrrigation(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'irrigation') continue
      if (!aliveRef.current) return
      setView({ watered: step.watered, position: step.position })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 160)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ watered: [], position: 0 })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = `Cultivos regados: ${view.watered.length} de ${CROP_COUNT}. El dron está en la casilla ${view.position}.`

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
