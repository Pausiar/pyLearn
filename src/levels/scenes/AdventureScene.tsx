import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { BACKPACK_LIMIT } from '../../engine/adventurer'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface AdventureView {
  items: string[]
  weights: number[]
  light: string[]
  done: boolean
}

function drawAdventure(context: CanvasRenderingContext2D, view: AdventureView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1d2233')
  rect(context, 118, 12, 100, 108, '#252c42')
  rect(context, 118, 12, 100, 5, '#333c58')

  label(context, 'MOCHILA GRANDE', 10, 14, 8, '#9aa8c2')

  view.items.forEach((item, index) => {
    const y = 22 + index * 17
    const weight = view.weights[index] ?? 0
    const ligero = weight <= BACKPACK_LIMIT

    rect(context, 10, y, 96, 15, ligero ? '#2f4a56' : '#33303f')
    label(context, item, 18, y + 11, 8, ligero ? '#d8ecf5' : '#a39ab0')
    rect(context, 84, y + 3, 16, 9, ligero ? '#3f8a4c' : '#7a4b4b')
    label(context, `${weight} kg`, 100, y + 11, 7, '#c9d4e4', 'right')
  })

  label(context, 'MOCHILA LIGERA', 128, 26, 8, '#9fd7a8')

  if (view.light.length === 0) {
    label(context, 'vacía todavía', 128, 50, 8, '#7f8db8')
  } else {
    view.light.forEach((item, index) => {
      const y = 34 + index * 17
      rect(context, 128, y, 80, 15, '#2f6f3a')
      label(context, item, 136, y + 11, 8, '#eaf7ee')
    })
  }

  label(context, `Peso máximo por objeto: ${BACKPACK_LIMIT} kg`, 10, 124, 8, '#7f8db8')
  label(
    context,
    view.done ? `objetos: ${view.light.length}` : 'sin salir',
    WIDTH - 10,
    124,
    8,
    view.done ? '#8de08f' : '#7f8db8',
    'right',
  )
}

/** Lienzo del aventurero: los pesos de la mochila grande y la lista que se lleva. */
export function AdventureScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<AdventureView>({ items: [], weights: [], light: [], done: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawAdventure(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'adventure') continue
      if (!aliveRef.current) return
      setView({ items: step.items, weights: step.weights, light: step.light, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 420)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ items: [], weights: [], light: [], done: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.done
    ? `La mochila ligera lleva ${view.light.join(', ')}.`
    : 'El aventurero todavía no ha preparado la mochila ligera.'

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
