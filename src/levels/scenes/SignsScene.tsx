import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { SIGN_GOAL } from '../../engine/signs'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

interface SignView {
  text: string
  lit: boolean
}

const RESTING: SignView = { text: '', lit: false }

function drawWall(context: CanvasRenderingContext2D): void {
  rect(context, 0, 0, WIDTH, HEIGHT, '#14101f')
  for (let row = 0; row < 8; row += 1) {
    rect(context, 0, row * 16, WIDTH, 1, '#1d1830')
    const offset = row % 2 ? 0 : 12
    for (let x = offset - 24; x < WIDTH; x += 24) rect(context, x, row * 16 + 1, 1, 15, '#1d1830')
  }
  rect(context, 0, 112, WIDTH, 16, '#0a0712')
}

function drawSign(context: CanvasRenderingContext2D, view: SignView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)
  drawWall(context)

  // Marco metálico con sombra y el tubo oscuro detrás.
  rect(context, 12, 30, 200, 60, '#0a0712')
  rect(context, 10, 28, 200, 60, '#2b2a3a')
  rect(context, 10, 28, 200, 2, '#44425a')
  rect(context, 14, 32, 192, 52, '#120e1c')

  if (!view.lit) {
    context.font = `600 14px ${MONO}`
    context.fillStyle = '#2e2a3f'
    context.textAlign = 'center'
    context.fillText(SIGN_GOAL, 112, 66)
    return
  }

  const expected = [...SIGN_GOAL]
  const shown = [...view.text]
  const wrong = new Set<number>()
  for (let i = 0; i < Math.max(expected.length, shown.length); i += 1) {
    if (expected[i] !== shown[i]) wrong.add(i)
  }

  // Cada letra se enciende con un pequeño retraso; las mal escritas parpadean en rojo.
  const cell = 11.5
  const startX = 112 - (shown.length * cell) / 2
  shown.forEach((character, index) => {
    const age = reduced ? 1 : Math.min((elapsed - index * 90) / 260, 1)
    if (age <= 0) return
    const isWrong = wrong.has(index)
    const flicker = isWrong && !reduced ? (Math.sin(elapsed / 90 + index) > 0 ? 1 : 0.25) : 1
    context.globalAlpha = age * flicker
    context.font = `700 15px ${MONO}`
    context.textAlign = 'left'
    context.textBaseline = 'middle'
    context.fillStyle = isWrong ? '#ff5a6a' : '#ff5fa2'
    context.fillText(character, startX + index * cell, 58)
    context.globalAlpha = 1
  })

  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  context.font = `600 9px ${MONO}`
  if (wrong.size > 0) {
    context.fillStyle = '#ffb3bb'
    context.fillText('Revisa las letras en rojo', 112, 104)
  } else {
    context.fillStyle = '#a3ffc4'
    context.fillText('ABIERTO · 24 HORAS', 112, 104)
  }
  label(context, 'CIUDAD DE NEÓN', 112, 120, 6, '#7f8db8', 'center')
}

/** Lienzo del letrero: se enciende letra a letra con el texto que le pasa el programa. */
export function SignsScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<SignView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawSign(context, view, now - bornRef.current, reduced)
        if (!reduced) frame = window.requestAnimationFrame(tick)
      }
      tick(performance.now())
    }

    return () => {
      aliveRef.current = false
      window.cancelAnimationFrame(frame)
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'sign') continue
      if (!aliveRef.current) return
      setView({ text: step.text, lit: step.lit })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 480)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.lit ? `El letrero dice: ${view.text}.` : 'El letrero está apagado.'

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
