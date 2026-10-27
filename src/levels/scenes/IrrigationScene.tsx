import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { CROP_COUNT } from '../../engine/irrigation'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

/** Cien cultivos en una cuadrícula de 20 columnas por 5 filas. */
const COLS = 20
const CELL_W = 10.4
const CELL_H = 14
const ORIGIN_X = 6
const ORIGIN_Y = 14

interface IrrigationView {
  watered: number[]
  position: number
}

const RESTING: IrrigationView = { watered: [], position: 0 }

function cellCenter(crop: number): { x: number; y: number } {
  const index = Math.min(Math.max(crop, 1), CROP_COUNT) - 1
  return {
    x: ORIGIN_X + (index % COLS) * CELL_W,
    y: ORIGIN_Y + Math.floor(index / COLS) * CELL_H,
  }
}

function drawIrrigation(context: CanvasRenderingContext2D, view: IrrigationView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  // Tierra y surcos en planos.
  rect(context, 0, 0, WIDTH, HEIGHT, '#2a2118')
  rect(context, 0, 0, WIDTH, 2, '#3a2d20')
  rect(context, 0, 118, WIDTH, 10, '#1a140e')

  const watered = new Set(view.watered)
  for (let crop = 1; crop <= CROP_COUNT; crop += 1) {
    const { x, y } = cellCenter(crop)
    const done = watered.has(crop)
    // El último cultivo regado brilla un instante.
    const fresh = done && crop === view.position && !reduced && elapsed < 400
    rect(context, x, y + 6, 6, 4, '#4a3a28')
    rect(context, x + 1, y + 2, 4, 4, done ? (fresh ? '#9be38f' : '#4ce07a') : '#6a5a40')
  }

  // El dron: se queda sobre la última casilla pisada.
  if (view.position >= 1) {
    const { x, y } = cellCenter(view.position)
    const dx = x + 3
    const dy = y - 2
    rect(context, dx - 4, dy, 8, 3, '#8ad0ff')
    rect(context, dx - 1, dy + 3, 2, 2, '#8ad0ff')
    if (!reduced) {
      const drop = (elapsed % 400) / 400
      context.fillStyle = 'rgba(138, 208, 255, 0.85)'
      context.fillRect(dx - 0.5, dy + 5 + drop * 4, 1, 2)
    }
  }

  // Panel con la cuenta de los cultivos regados.
  rect(context, 4, 100, 150, 22, 'rgba(10,18,38,0.85)')
  label(context, `dron en ${view.position}   regados: ${view.watered.length}/${CROP_COUNT}`, 10, 115, 8, '#e8f1ff')
  if (view.watered.length === CROP_COUNT) label(context, '¡Campo listo!', 214, 115, 8, '#ffe08a', 'right')
  label(context, 'RIEGO EN BUCLE', 214, 124, 6, '#7fa88a', 'right')
}

/** Lienzo del campo grande: cuántos cultivos van regados de los cien. */
export function IrrigationScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<IrrigationView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawIrrigation(context, view, now - bornRef.current, reduced)
        if (!reduced) frame = window.requestAnimationFrame(tick)
      }
      tick(performance.now())
    }

    return () => {
      aliveRef.current = false
      window.cancelAnimationFrame(frame)
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'irrigation') continue
      if (!aliveRef.current) return
      setView({ watered: step.watered, position: step.position })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 180)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
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
