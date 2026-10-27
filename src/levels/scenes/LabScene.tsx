import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface LabView {
  readings: { room: string; value: number }[]
}

function lastValue(view: LabView, room: string): number | null {
  const found = [...view.readings].reverse().find((reading) => reading.room === room)
  return found ? found.value : null
}

function drawLab(context: CanvasRenderingContext2D, view: LabView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#101a28')

  const sala = lastValue(view, 'sala')
  const fuera = lastValue(view, 'fuera')

  rect(context, 12, 12, 92, 60, '#252c42')
  rect(context, 12, 12, 92, 4, '#33405c')
  label(context, 'SALA (DENTRO)', 20, 26, 8, '#9aa8c2')
  label(context, sala === null ? '—' : String(sala), 20, 64, 24, '#8fd3a6')

  rect(context, 120, 12, 92, 60, '#252c42')
  rect(context, 120, 12, 92, 4, '#33405c')
  label(context, 'FUERA (GLOBAL)', 128, 26, 8, '#9aa8c2')
  label(context, fuera === null ? '—' : String(fuera), 128, 64, 24, '#4aa8ff')

  label(context, 'CUADERNO', 12, 88, 8, '#b9a8c2')

  view.readings.forEach((reading, index) => {
    label(
      context,
      `${index + 1}. ${reading.room}: ${reading.value} grados`,
      12,
      96 + index * 9,
      8,
      reading.room === 'sala' ? '#8fd3a6' : '#4aa8ff',
    )
  })
}

/** Lienzo del laboratorio: el termómetro de dentro, el de fuera y el cuaderno. */
export function LabScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<LabView>({ readings: [] })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawLab(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'lab') continue
      if (!aliveRef.current) return
      setView({ readings: step.readings })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 340)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ readings: [] })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.readings.length === 0
      ? 'El cuaderno del laboratorio está vacío.'
      : `El cuaderno anota: ${view.readings
          .map((reading) => `${reading.room} ${reading.value}`)
          .join(', ')}.`

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
