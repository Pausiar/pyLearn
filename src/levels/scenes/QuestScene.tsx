import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface QuestView {
  room: string
  visited: string[]
  item: string | null
  done: boolean
}

const ROOMS: readonly { name: string; x: number }[] = [
  { name: 'inicio', x: 14 },
  { name: 'cueva', x: 88 },
  { name: 'tesoro', x: 162 },
]

function drawQuest(context: CanvasRenderingContext2D, view: QuestView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#101a2e')
  rect(context, 0, 0, WIDTH, 18, '#1a2740')
  label(context, 'MAPA DE LA AVENTURA', 8, 6, 10, '#8fb7ff')
  label(context, `${view.visited.length} visitadas`, 216, 6, 9, '#9aa8c2', 'right')

  ROOMS.forEach((room, index) => {
    if (index > 0) {
      const previous = ROOMS[index - 1]!
      rect(context, previous.x + 62, 50, 12, 3, '#3a4a63')
    }

    const here = view.room === room.name
    const seen = view.visited.includes(room.name)
    rect(context, room.x, 30, 62, 44, here ? '#2a4470' : seen ? '#1e3050' : '#182338')
    rect(context, room.x, 30, 62, 4, here ? '#8fb7ff' : seen ? '#4a8fe7' : '#3a4a63')
    label(context, room.name.toUpperCase(), room.x + 6, 48, 10, here ? '#e8f1ff' : '#cfe0ff')
    label(context, here ? 'aquí' : seen ? 'visitada' : 'sin visitar', room.x + 6, 64, 9, here ? '#ffd479' : '#9aa8c2')
  })

  rect(context, 0, 100, WIDTH, 28, '#1a2740')
  label(
    context,
    view.item === null ? 'MOCHILA: por abrir' : `MOCHILA: ${view.item}`,
    8,
    112,
    9,
    view.item === null ? '#9aa8c2' : '#ffe9a8',
  )
  label(context, view.done ? 'RECORRIDO COMPLETO' : 'Recorriendo el mapa', 216, 112, 9, view.done ? '#8fd3a6' : '#9aa8c2', 'right')
}

/** Lienzo de la aventura: las salas del mapa y por dónde va el mayordomo. */
export function QuestScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<QuestView>({ room: 'inicio', visited: [], item: null, done: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawQuest(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'quest') continue
      if (!aliveRef.current) return
      setView({ room: step.room, visited: step.visited, item: step.item, done: step.done })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ room: 'inicio', visited: [], item: null, done: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.visited.length === 0
      ? 'El mayordomo todavía no ha salido de la primera sala.'
      : `El mayordomo ha pasado por ${view.visited.join(', ')} y está en ${view.room}.${
          view.item === null ? '' : ` Lleva en la mochila ${view.item}.`
        }`

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
