import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { AISLE_BOXES, CARGO_LIMIT, EMPTY_AISLES, SCANNER_AISLES } from '../../engine/scanner'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2
const AISLE_STEP = 35

interface ScannerView {
  readings: number[]
  boxes: number
  reached: number
}

const RESTING: ScannerView = { readings: [], boxes: 0, reached: 0 }

function drawWarehouse(context: CanvasRenderingContext2D): void {
  rect(context, 0, 0, WIDTH, HEIGHT, '#11161f')
  rect(context, 0, 108, WIDTH, 20, '#1b2230')
  rect(context, 0, 108, WIDTH, 2, '#2a3445')
}

function drawAisles(context: CanvasRenderingContext2D, view: ScannerView): void {
  SCANNER_AISLES.forEach((aisle, index) => {
    const x = 8 + index * AISLE_STEP
    const reviewed = view.readings.includes(aisle)
    const skipped = EMPTY_AISLES.includes(aisle) && view.reached > aisle

    // Estantería en planos: marco, baldas y cajas que cambian de color al revisarse.
    rect(context, x, 26, 28, 76, '#1c2433')
    rect(context, x, 26, 28, 3, '#2c3648')
    for (let shelf = 0; shelf < 3; shelf += 1) rect(context, x + 2, 42 + shelf * 22, 24, 2, '#3a4560')

    const boxes = AISLE_BOXES[aisle] ?? 0
    for (let box = 0; box < boxes; box += 1) {
      rect(context, x + 4 + (box % 3) * 7, 44 + Math.floor(box / 3) * 22, 6, 6, reviewed ? '#ffd86a' : '#8a6a3a')
    }
    if (skipped) label(context, 'vacío', x + 14, 70, 6, '#8f9bb8', 'center')

    label(context, `P${aisle}`, x + 14, 118, 8, reviewed ? '#9fd7a8' : skipped ? '#8f9bb8' : '#7f8db8', 'center')
  })
}

function drawScanner(context: CanvasRenderingContext2D, view: ScannerView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)
  drawWarehouse(context)
  drawAisles(context, view)

  // Escáner: se pone en el último pasillo alcanzado; da un saltito al moverse.
  const index = Math.max(0, SCANNER_AISLES.findIndex((aisle) => aisle === view.reached))
  const x = 22 + index * AISLE_STEP
  const hop = !reduced && view.reached > 0 && view.boxes < CARGO_LIMIT ? Math.abs(Math.sin(elapsed / 200)) * 4 : 0
  rect(context, x - 4, 22 - hop, 8, 6, '#4aa8ff')
  rect(context, x - 3, 16 - hop, 6, 6, '#8ad0ff')

  // Cinta transportadora: se llena hasta el límite y luego se para.
  const full = view.boxes >= CARGO_LIMIT
  rect(context, 120, 12, 96, 14, '#0a0f1c')
  rect(context, 122, 14, 92 * Math.min(view.boxes / CARGO_LIMIT, 1), 10, full ? '#4ce07a' : '#ffd86a')
  label(context, `cajas: ${view.boxes}`, 122, 36, 8, '#e8f1ff')

  if (full) {
    rect(context, 120, 42, 96, 14, '#1d3a2a')
    label(context, `break: caja llena con ${CARGO_LIMIT}`, 124, 52, 7, '#a3ffc4')
  }

  rect(context, 4, 100, 110, 22, 'rgba(10,18,38,0.85)')
  label(context, `Cajas cargadas: ${view.boxes}`, 10, 115, 8, '#e8f1ff', 'left')
}

/** Lienzo del almacén: los pasillos impares, los vacíos que se saltan y la cinta que se llena. */
export function ScannerScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<ScannerView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawScanner(context, view, now - bornRef.current, reduced)
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
      if (step.kind !== 'scanner') continue
      if (!aliveRef.current) return
      setView({ readings: step.readings, boxes: step.boxes, reached: step.reached })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.readings.length === 0
      ? 'El escáner todavía no ha revisado ningún pasillo.'
      : `Pasillos revisados: ${view.readings.join(', ')}. Cajas cargadas: ${view.boxes}.`

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
