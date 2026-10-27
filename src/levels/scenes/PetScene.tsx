import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2
const MAX_ENERGY = 3

interface PetView {
  name: string
  energy: number
  recorded: boolean
}

function drawPet(context: CanvasRenderingContext2D, view: PetView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#1b1726')
  rect(context, 0, 0, WIDTH, 18, '#29233a')
  label(context, 'EL REFUGIO', 8, 6, 10, '#c9a7ff')
  label(context, view.recorded ? 'ficha apuntada' : 'sin ficha', 216, 6, 9, view.recorded ? '#8fd3a6' : '#ffb648', 'right')

  // La mascota: cuerpo, orejas, ojos y hocico.
  rect(context, 34, 52, 44, 34, '#e7a44a')
  rect(context, 38, 42, 14, 14, '#c98d4a')
  rect(context, 60, 42, 14, 14, '#c98d4a')
  rect(context, 44, 62, 8, 8, '#2a2340')
  rect(context, 62, 62, 8, 8, '#2a2340')
  rect(context, 52, 76, 12, 6, '#2a2340')
  rect(context, 30, 86, 12, 8, '#c98d4a')
  rect(context, 72, 86, 12, 8, '#c98d4a')
  rect(context, 42, 46, 6, 6, '#ffd479')
  rect(context, 64, 46, 6, 6, '#ffd479')

  label(context, view.name.toUpperCase(), 104, 40, 11, '#e8f1ff')

  for (let index = 0; index < MAX_ENERGY; index += 1) {
    const filled = index < view.energy
    rect(context, 104 + index * 22, 52, 16, 14, filled ? '#e7777b' : '#3a3450')
    if (filled) rect(context, 108 + index * 22, 56, 8, 6, '#ffd9da')
  }

  label(context, `energia ${view.energy} de ${MAX_ENERGY}`, 104, 82, 9, '#9aa8c2')

  rect(context, 104, 92, 104, 26, '#29233a')
  label(context, 'FICHA', 110, 100, 9, '#c9a7ff')
  label(context, view.recorded ? `${view.name} · ${view.energy}` : 'sin apuntar', 110, 112, 9, view.recorded ? '#8fd3a6' : '#9aa8c2')
}

/** Lienzo de la mascota: su energía en corazones y la ficha del refugio. */
export function PetScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<PetView>({ name: 'Rex', energy: MAX_ENERGY, recorded: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawPet(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'pet') continue
      if (!aliveRef.current) return
      setView({ name: step.name, energy: step.energy, recorded: step.recorded })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ name: 'Rex', energy: MAX_ENERGY, recorded: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = `La mascota ${view.name} tiene ${view.energy} de ${MAX_ENERGY} de energía.${
    view.recorded ? ' Su ficha está apuntada en el refugio.' : ''
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
