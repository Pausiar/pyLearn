import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface AlbumView {
  cards: string[]
  unique: string[]
  ficha: [string, number] | null
  delivered: boolean
}

function drawAlbum(context: CanvasRenderingContext2D, view: AlbumView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1b1530')
  rect(context, 0, 0, WIDTH, 18, '#2a2044')
  label(context, 'ALBUM DE CROMOS', 8, 6, 10, '#d8b4ff')
  label(
    context,
    view.delivered ? 'ENTREGADO' : 'SIN ENTREGAR',
    216,
    6,
    10,
    view.delivered ? '#8fd3a6' : '#ffb648',
    'right',
  )

  const firstSeen = new Map<string, number>()
  view.cards.forEach((card, index) => {
    if (!firstSeen.has(card)) firstSeen.set(card, index)
  })

  view.cards.forEach((card, index) => {
    const x = 14 + (index % 3) * 68
    const y = 24 + Math.floor(index / 3) * 34
    const repeat = firstSeen.get(card) !== index
    const kept = view.unique.includes(card) && !repeat

    rect(context, x, y, 60, 28, kept ? '#3a2a5c' : '#241d3a')
    rect(context, x, y, 60, 3, kept ? '#c79bff' : '#4a4266')
    label(context, card.toUpperCase(), x + 6, y + 10, 10, kept ? '#f0e4ff' : '#8a80a8')
    label(context, repeat ? 'REPE' : kept ? 'UNICO' : '', x + 54, y + 10, 8, repeat ? '#e7777b' : '#8fd3a6', 'right')
  })

  rect(context, 0, 104, WIDTH, 24, '#241b3d')
  if (view.ficha === null) {
    label(context, 'FICHA: sin guardar', 8, 112, 9, '#9aa8c2')
  } else {
    rect(context, 8, 108, 104, 16, '#4a3560')
    label(context, 'FICHA', 13, 112, 9, '#d8b4ff')
    label(context, `${view.ficha[0]} · ${view.ficha[1]}`, 107, 112, 9, '#ffe9a8', 'right')
    label(context, `UNICOS: ${view.unique.length}`, 212, 112, 9, '#8fd3a6', 'right')
  }
}

/** Lienzo del álbum: los cromos que salen, los repes y la ficha guardada. */
export function AlbumScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<AlbumView>({ cards: [], unique: [], ficha: null, delivered: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawAlbum(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'album') continue
      if (!aliveRef.current) return
      setView({ cards: step.cards, unique: step.unique, ficha: step.ficha, delivered: step.delivered })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ cards: [], unique: [], ficha: null, delivered: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.unique.length === 0
      ? 'El álbum todavía no tiene cromos.'
      : `El álbum tiene ${view.unique.length} cromos únicos: ${view.unique.join(', ')}.${
          view.ficha === null ? '' : ` La ficha guardada es ${view.ficha[0]} con el número ${view.ficha[1]}.`
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
