import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2
const MAX_LIFE = 5

interface BeastView {
  name: string
  life: number
  born: boolean
}

function drawBeast(context: CanvasRenderingContext2D, view: BeastView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#20161a')
  rect(context, 0, 0, WIDTH, 18, '#31202a')
  label(context, 'EL BESTIARIO', 8, 6, 10, '#e7777b')
  label(context, view.born ? 'ficha apuntada' : 'sin ficha', 216, 6, 9, view.born ? '#8fd3a6' : '#ffb648', 'right')

  // El dragón: cuerpo, cola, cuello, cabeza y alas.
  rect(context, 46, 62, 76, 34, '#7a5cff')
  rect(context, 30, 74, 18, 12, '#5f45d8')
  rect(context, 20, 68, 12, 8, '#5f45d8')
  rect(context, 108, 46, 26, 22, '#7a5cff')
  rect(context, 132, 52, 14, 12, '#5f45d8')
  rect(context, 96, 34, 22, 26, '#9d7ce7')
  rect(context, 60, 40, 34, 24, '#5f45d8')
  rect(context, 112, 56, 6, 6, '#ffe9a8')
  rect(context, 52, 96, 12, 10, '#5f45d8')
  rect(context, 100, 96, 12, 10, '#5f45d8')

  label(context, view.name.toUpperCase(), 24, 116, 11, '#ffe9a8')

  rect(context, 130, 26, 82, 46, '#31202a')
  label(context, 'VIDA', 138, 38, 9, '#e7777b')
  for (let index = 0; index < MAX_LIFE; index += 1) {
    const filled = index < view.life
    rect(context, 138 + index * 14, 46, 11, 16, filled ? '#e7777b' : '#4a3a44')
  }
  label(context, `${view.life} de ${MAX_LIFE}`, 138, 80, 9, '#9aa8c2')

  rect(context, 130, 90, 82, 26, '#31202a')
  label(context, 'RUGIDO', 138, 100, 9, '#e7777b')
  label(context, view.born ? '¡GRRR!' : 'sin probar', 138, 112, 10, view.born ? '#ffe9a8' : '#9aa8c2')
}

/** Lienzo del bestiario: el dragón, su vida y su rugido. */
export function BeastScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<BeastView>({ name: 'Smaug', life: MAX_LIFE, born: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawBeast(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'beast') continue
      if (!aliveRef.current) return
      setView({ name: step.name, life: step.life, born: step.born })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ name: 'Smaug', life: MAX_LIFE, born: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = `${view.name} tiene ${view.life} de ${MAX_LIFE} de vida.${
    view.born ? ' Su ficha está en el bestiario.' : ''
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
