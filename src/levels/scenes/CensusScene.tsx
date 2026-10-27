import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface CensusView {
  planets: { name: string; people: number }[]
  total: number
  listed: boolean
}

const STARS: readonly (readonly [number, number])[] = [
  [18, 16],
  [52, 24],
  [96, 14],
  [140, 22],
  [186, 12],
  [210, 34],
  [36, 46],
  [206, 60],
]

function drawCensus(context: CanvasRenderingContext2D, view: CensusView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#0d1424')
  for (const [x, y] of STARS) rect(context, x, y, 2, 2, '#3c4a66')

  label(context, 'CENSO DE LA FLOTA', 8, 6, 10, '#8fb7ff')
  label(context, `HABITANTES: ${view.total}`, 216, 6, 10, view.listed ? '#8fd3a6' : '#feb', 'right')

  const biggest = Math.max(1, ...view.planets.map((planet) => planet.people))
  view.planets.forEach((planet, index) => {
    const x = 28 + index * 60
    const height = Math.round((planet.people / biggest) * 52)
    const bar = index === 0 ? '#4a8fe7' : index === 1 ? '#e7a44a' : '#9d7ce7'
    rect(context, x, 96 - height, 34, height, bar)
    rect(context, x, 96 - height, 34, 3, '#e8f1ff')
    label(context, planet.name.toUpperCase(), x, 100, 9, '#cfe0ff')
    label(context, String(planet.people), x + 34, 84 - height, 10, '#ffe9a8', 'right')
  })

  rect(context, 0, 112, WIDTH, 16, '#141d30')
  label(
    context,
    view.listed ? `TOTAL: ${view.total} HABITANTES` : 'TOTAL: por contar',
    8,
    116,
    9,
    view.listed ? '#8fd3a6' : '#9aa8c2',
  )
}

/** Lienzo del censo: cada planeta con su barra y el total que va contando. */
export function CensusScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<CensusView>({ planets: [], total: 0, listed: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawCensus(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'census') continue
      if (!aliveRef.current) return
      setView({ planets: step.planets, total: step.total, listed: step.listed })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ planets: [], total: 0, listed: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.planets.length === 0
      ? 'El censo todavía no tiene planetas.'
      : `El censo lleva ${view.planets
          .map((planet) => `${planet.name} con ${planet.people}`)
          .join(', ')}. En total ${view.total} habitantes.`

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
