import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { MINE_ROCKS } from '../../engine/mine'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface MineView {
  rocks: number
  picadas: number
}

function drawMine(context: CanvasRenderingContext2D, view: MineView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#241a12')
  rect(context, 0, 96, WIDTH, 32, '#3a2a1c')
  rect(context, 0, 96, WIDTH, 3, '#5a412b')

  const minadas = MINE_ROCKS - view.rocks
  for (let index = 0; index < MINE_ROCKS; index += 1) {
    const x = 30 + index * 28
    if (index < minadas) {
      rect(context, x, 58, 20, 18, '#2f2318')
      rect(context, x + 2, 74, 16, 2, '#4b3826')
      continue
    }
    rect(context, x, 58, 20, 18, '#8b8f9a')
    rect(context, x + 3, 61, 8, 6, '#b9bfcc')
  }

  // El robot minero, a la izquierda de la veta.
  rect(context, 8, 62, 14, 22, '#c9ccd6')
  rect(context, 10, 56, 10, 8, '#e8ecf5')
  rect(context, 4, 68, 5, 4, '#9aa3b2')
  rect(context, 20, 60, 3, 26, '#d9b44a')

  label(context, `Piedras picadas: ${view.picadas}`, 12, 22, 9, '#f2e6d8')
  label(
    context,
    view.rocks === 0 ? 'La veta está agotada' : `Quedan ${view.rocks} piedras en la veta`,
    12,
    38,
    8,
    '#d8b98f',
  )
  label(context, 'MINA DEL NORTE', WIDTH - 10, 120, 8, '#8a7360', 'right')
}

/** Lienzo de la mina: las piedras que quedan y las que se han picado. */
export function MineScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<MineView>({ rocks: MINE_ROCKS, picadas: 0 })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawMine(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'mine') continue
      if (!aliveRef.current) return
      setView({ rocks: step.rocks, picadas: step.picadas })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ rocks: MINE_ROCKS, picadas: 0 })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.rocks === 0
      ? `La veta está agotada: ${view.picadas} piedras picadas.`
      : `${view.picadas} piedras picadas y ${view.rocks} en la veta.`

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
