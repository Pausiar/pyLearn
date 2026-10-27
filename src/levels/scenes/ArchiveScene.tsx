import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface ArchiveView {
  rooms: { name: string; hall: string; pieces: number }[]
  visited: string[]
  delivered: boolean
}

function drawArchive(context: CanvasRenderingContext2D, view: ArchiveView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1a1410')
  rect(context, 0, 0, WIDTH, 18, '#2a2018')
  label(context, 'ARCHIVO DEL MUSEO', 8, 6, 10, '#ffd479')
  label(
    context,
    view.delivered ? 'CONSULTADO' : 'SIN CONSULTAR',
    216,
    6,
    10,
    view.delivered ? '#8fd3a6' : '#ffb648',
    'right',
  )

  view.rooms.forEach((room, index) => {
    const x = 12 + index * 70
    const visited = view.visited.includes(room.name)
    rect(context, x, 32, 62, 62, visited ? '#3a2c1c' : '#241d18')
    rect(context, x, 32, 62, 4, visited ? '#ffd479' : '#5a4a3a')
    label(context, room.name.toUpperCase(), x + 6, 42, 10, visited ? '#ffe9a8' : '#9a8a78')
    label(context, `sala ${room.hall}`, x + 6, 58, 9, visited ? '#d7e4ff' : '#7a6c60')
    label(context, `${room.pieces} piezas`, x + 6, 72, 9, visited ? '#d7e4ff' : '#7a6c60')
  })

  const total = view.rooms.reduce((sum, room) => sum + room.pieces, 0)
  rect(context, 0, 106, WIDTH, 22, '#241d18')
  label(
    context,
    view.delivered ? `TOTAL: ${total} PIEZAS` : 'Quedan salas por consultar',
    8,
    112,
    9,
    view.delivered ? '#8fd3a6' : '#9aa8c2',
  )
}

/** Lienzo del archivo: las salas del museo y cuáles ya se han consultado. */
export function ArchiveScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<ArchiveView>({ rooms: [], visited: [], delivered: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawArchive(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'archive') continue
      if (!aliveRef.current) return
      setView({ rooms: step.rooms, visited: step.visited, delivered: step.delivered })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ rooms: [], visited: [], delivered: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.rooms.length === 0
      ? 'El archivo todavía está cerrado.'
      : `El archivo tiene ${view.rooms
          .map((room) => `${room.name} en la sala ${room.hall} con ${room.pieces} piezas`)
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
