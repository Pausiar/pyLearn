import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface HuntView {
  monsters: { name: string; level: number }[]
  caught: string[]
  done: boolean
}

function drawHunt(context: CanvasRenderingContext2D, view: HuntView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#101d16')
  rect(context, 0, 0, WIDTH, 18, '#16281d')
  label(context, 'CAZAMONSTRUOS', 8, 6, 10, '#9fe7b4')
  label(context, `${view.caught.length} EN LA JAULA`, 216, 6, 10, '#ffe9a8', 'right')

  view.monsters.forEach((monster, index) => {
    const y = 26 + index * 18
    const caught = view.caught.includes(monster.name)
    rect(context, 8, y, 208, 15, caught ? '#1c3324' : '#16241c')
    rect(context, 8, y, 3, 15, caught ? '#8fd3a6' : '#3d5c46')
    label(context, monster.name.toUpperCase(), 18, y + 4, 10, caught ? '#d9ffe6' : '#cfe0ff')
    rect(context, 96, y + 5, 72, 5, '#22331f')
    rect(context, 96, y + 5, monster.level * 8, 5, monster.level > 5 ? '#e7777b' : '#4aa86a')
    label(context, `nivel ${monster.level}`, 172, y + 4, 9, '#9aa8c2')
    if (caught) label(context, 'CAZADO', 212, y + 4, 9, '#8fd3a6', 'right')
  })

  label(
    context,
    view.done ? 'La jaula está llena' : 'Solo entran los de nivel mayor que 5',
    8,
    114,
    9,
    view.done ? '#8fd3a6' : '#9aa8c2',
  )
}

/** Lienzo de la cacería: qué monstruos hay, su peligro y cuáles van a la jaula. */
export function HuntScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<HuntView>({ monsters: [], caught: [], done: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawHunt(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'hunt') continue
      if (!aliveRef.current) return
      setView({ monsters: step.monsters, caught: step.caught, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ monsters: [], caught: [], done: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.monsters.length === 0
      ? 'Todavía no hay monstruos a la vista.'
      : `En el bosque hay ${view.monsters
          .map((monster) => `${monster.name} de nivel ${monster.level}`)
          .join(', ')}. En la jaula van ${view.caught.length}.`

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
