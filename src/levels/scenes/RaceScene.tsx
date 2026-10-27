import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface RaceView {
  times: number[]
  order: number[] | null
  pilot: string | null
  secret: number | null
}

const DRIVERS = ['Sara', 'Leo', 'Nuria', 'Teo']

function drawRace(context: CanvasRenderingContext2D, view: RaceView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#111c1a')
  rect(context, 0, 0, WIDTH, 18, '#1b2b26')
  label(context, 'LA CARRERA', 8, 6, 10, '#9fe7b4')
  label(context, 'tiempos en segundos', 216, 6, 9, '#9aa8c2', 'right')

  const fastest = view.order === null ? null : view.order[0]

  DRIVERS.forEach((driver, index) => {
    const time = view.times[index] ?? 0
    const y = 28 + index * 18
    const leading = fastest === time
    rect(context, 12, y, 130, 15, leading ? '#1c3324' : '#16241c')
    label(context, driver, 18, y + 11, 10, leading ? '#d9ffe6' : '#cfe0ff')

    const width = 60 - Math.round((time - 30) * 2)
    rect(context, 60, y + 5, 60, 5, '#22331f')
    rect(context, 60, y + 5, Math.max(6, width), 5, leading ? '#8fd3a6' : '#4aa86a')

    label(context, String(time), 136, y + 11, 10, leading ? '#ffe9a8' : '#9aa8c2', 'right')
  })

  rect(context, 152, 28, 60, 66, '#1b2b26')
  label(context, 'PODIO', 158, 40, 9, '#9fe7b4')
  label(context, view.pilot ?? 'sin decidir', 158, 56, 10, view.pilot === null ? '#9aa8c2' : '#ffe9a8')
  label(context, fastest === null ? 'sin ordenar' : `${fastest} s`, 158, 72, 9, '#9aa8c2')

  rect(context, 0, 100, WIDTH, 28, '#1b2b26')
  label(context, 'NÚMERO SECRETO', 12, 112, 9, '#8fb7ff')
  rect(context, 130, 102, 30, 22, '#141d1a')
  label(context, view.secret === null ? '??' : String(view.secret), 145, 119, 13, view.secret === null ? '#5f7595' : '#ffe9a8', 'center')
  label(context, view.secret === null ? 'por elegir' : 'elegido', 210, 118, 9, '#9aa8c2', 'right')
}

/** Lienzo de la carrera: los tiempos, el podio y el número secreto. */
export function RaceScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<RaceView>({ times: [], order: null, pilot: null, secret: null })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawRace(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'race') continue
      if (!aliveRef.current) return
      setView({ times: step.times, order: step.order, pilot: step.pilot, secret: step.secret })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ times: [], order: null, pilot: null, secret: null })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.times.length === 0
      ? 'La carrera no ha empezado.'
      : `Los tiempos son ${view.times.join(', ')} segundos.${
          view.pilot === null ? '' : ` El podio es para ${view.pilot}.`
        }${view.secret === null ? '' : ` El número secreto es ${view.secret}.`}`

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
