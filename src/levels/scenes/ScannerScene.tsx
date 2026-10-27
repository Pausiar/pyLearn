import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { AISLE_BOXES, CARGO_LIMIT, EMPTY_AISLES, SCANNER_AISLES } from '../../engine/scanner'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface ScannerView {
  readings: number[]
  boxes: number
  reached: number
}

type AisleState = 'revisado' | 'saltado' | 'pendiente'

function stateOf(aisle: number, view: ScannerView): AisleState {
  if (view.readings.includes(aisle)) return 'revisado'
  if (EMPTY_AISLES.includes(aisle) && view.reached > aisle) return 'saltado'
  return 'pendiente'
}

function detailOf(aisle: number, state: AisleState): string {
  if (state === 'revisado') return `${AISLE_BOXES[aisle] ?? 0} cajas`
  if (state === 'saltado') return 'vacío: salta con continue'
  return 'sin revisar'
}

function drawScanner(context: CanvasRenderingContext2D, view: ScannerView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#12161f')

  SCANNER_AISLES.forEach((aisle, index) => {
    const y = 8 + index * 18
    const state = stateOf(aisle, view)
    const colour = state === 'revisado' ? '#1f5c38' : state === 'saltado' ? '#2b3145' : '#232a3d'

    rect(context, 8, y, 16, 15, state === 'pendiente' ? '#232a3d' : colour)
    label(context, `P${aisle}`, 16, y + 11, 8, '#e8f1ff', 'center')
    rect(context, 28, y + 5, 26, 5, state === 'revisado' ? '#4aa8ff' : '#39415a')
    label(
      context,
      detailOf(aisle, state),
      60,
      y + 11,
      8,
      state === 'revisado' ? '#bdf0c4' : state === 'saltado' ? '#8f9bb8' : '#6b7592',
    )
  })

  const lleno = view.boxes >= CARGO_LIMIT
  label(context, `Cajas cargadas: ${view.boxes}`, 8, 122, 9, lleno ? '#bdf0c4' : '#e8f1ff')
  label(
    context,
    lleno ? `caja llena con ${CARGO_LIMIT}: para con break` : `la caja se llena con ${CARGO_LIMIT}`,
    WIDTH - 8,
    122,
    8,
    lleno ? '#8de08f' : '#8f9bb8',
    'right',
  )
}

/** Lienzo del almacén: qué pasillos se han revisado, cuáles se saltan y cuáles no se alcanzan. */
export function ScannerScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<ScannerView>({ readings: [], boxes: 0, reached: 0 })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawScanner(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'scanner') continue
      if (!aliveRef.current) return
      setView({ readings: step.readings, boxes: step.boxes, reached: step.reached })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ readings: [], boxes: 0, reached: 0 })
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
