import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

type LockState = boolean | null

const RESTING: LockState[] = [null, null, null]

function drawLock(context: CanvasRenderingContext2D, x: number, state: LockState, elapsed: number, reduced: boolean): void {
  // Un candado que ha dado False tiembla; uno abierto se levanta el arco.
  const shake = state === false && !reduced ? Math.sin(elapsed / 40) * 2 : 0
  const turn = state === true ? Math.min(elapsed / 400, 1) : 0
  const archTop = state === true ? 62 - turn * 10 : 66

  // Cuerpo del candado en planos: sombra, cara y lado oscuro.
  rect(context, x - 22 + shake, 84, 44, 40, '#0a0f1c')
  rect(context, x - 20 + shake, 78, 40, 36, '#8a94a8')
  rect(context, x + 14 + shake, 78, 6, 36, '#6a7388')
  rect(context, x - 20 + shake, 78, 40, 3, '#aab3c4')

  // Arco: se levanta al abrirse; en color según el resultado.
  context.strokeStyle = state === true ? '#ffe08a' : state === false ? '#ff7b8a' : '#4a5575'
  context.lineWidth = 4
  context.beginPath()
  context.moveTo(x - 12 + shake, 78)
  context.lineTo(x - 12 + shake, archTop)
  context.lineTo(x + 12 + shake, archTop)
  context.lineTo(x + 12 + shake, 78)
  context.stroke()

  // Ojo de la cerradura.
  rect(context, x - 3 + shake, 92, 6, 6, state === true ? '#ffe08a' : '#2a3350')
  rect(context, x - 1 + shake, 98, 2, 6, state === true ? '#ffe08a' : '#2a3350')
}

function drawLocks(context: CanvasRenderingContext2D, open: LockState[], elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#0e1420')
  rect(context, 0, 116, WIDTH, 12, '#1a2232')
  rect(context, 0, 116, WIDTH, 2, '#2c3648')

  // Puerta blindada detrás de los candados, con remaches en planos.
  rect(context, 8, 14, 208, 60, '#1d2638')
  rect(context, 8, 14, 208, 3, '#2c3648')
  for (let index = 0; index < 6; index += 1) rect(context, 14 + index * 34, 18, 3, 3, '#3a4560')

  const xs = [40, 112, 184]
  open.forEach((state, index) => {
    drawLock(context, xs[index] ?? 0, state, elapsed - index * 120, reduced)
    label(context, String(index + 1), xs[index] ?? 0, 74, 9, '#7f8db8', 'center')
  })

  const failed = open.findIndex((state) => state === false)
  if (failed !== -1) {
    rect(context, 14, 104, 196, 10, '#2a1d24')
    label(context, `candado ${failed + 1}: la condición es False`, 112, 111, 7, '#ffb3bb', 'center')
  }
}

/** Lienzo de la cerradura: los tres candados de la puerta blindada. */
export function LocksScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [open, setOpen] = useState<LockState[]>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawLocks(context, open, now - bornRef.current, reduced)
        if (!reduced) frame = window.requestAnimationFrame(tick)
      }
      tick(performance.now())
    }

    return () => {
      aliveRef.current = false
      window.cancelAnimationFrame(frame)
    }
  }, [open])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'locks') continue
      if (!aliveRef.current) return
      setOpen(step.open)
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 480)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setOpen(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const abiertos = open.filter((state) => state === true).length
  const description = `Candados abiertos: ${abiertos} de 3.`

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
