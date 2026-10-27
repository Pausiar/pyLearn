import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { VAULT_SECRET, VAULT_TRIES } from '../../engine/vault'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface VaultView {
  tried: number[]
  opened: boolean
}

const RESTING: VaultView = { tried: [], opened: false }

function drawVault(context: CanvasRenderingContext2D, view: VaultView, elapsed: number, reduced: boolean): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  const last = view.tried.at(-1)
  const failing = last !== undefined && last !== VAULT_SECRET && !view.opened
  const shake = failing && !reduced ? Math.sin(elapsed / 40) * 1.5 : 0

  rect(context, 0, 0, WIDTH, HEIGHT, '#11121a')
  rect(context, 0, 110, WIDTH, 18, '#1d1f2a')

  // Marco de acero con sombra y tornillos en planos.
  rect(context, shake + 40, 18, 144, 92, '#050608')
  rect(context, shake + 36, 14, 144, 92, '#4a505e')
  rect(context, shake + 36, 14, 144, 4, '#6b7385')
  for (let index = 0; index < 4; index += 1) rect(context, shake + 40 + index * 36, 18, 4, 4, '#2a2f3a')

  // Puerta: se abre girando cuando acierta.
  const swing = view.opened && !reduced ? Math.min(elapsed / 500, 1) : view.opened ? 1 : 0
  const doorWidth = 120 * (1 - swing * 0.85)
  rect(context, shake + 44, 22, doorWidth, 84, '#2e3441')
  rect(context, shake + 44, 22, doorWidth, 3, '#4a5268')

  // Rueda de combinación: marca el último número probado.
  const cx = 112 + shake
  const cy = 62
  const angle = last === undefined ? -Math.PI / 2 : (last / VAULT_TRIES) * Math.PI * 2 - Math.PI / 2
  context.strokeStyle = '#8a92a4'
  context.lineWidth = 4
  context.beginPath()
  context.arc(cx, cy, 16, 0, Math.PI * 2)
  context.stroke()
  context.strokeStyle = failing ? '#ff5a6a' : view.opened ? '#4ce07a' : '#ffe08a'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(cx, cy)
  context.lineTo(cx + Math.cos(angle) * 12, cy + Math.sin(angle) * 12)
  context.stroke()

  // Luces de estado: roja al fallar, verde al abrir.
  rect(context, 18, 18, 8, 8, failing ? '#ff5a6a' : '#4a2a33')
  rect(context, 18, 32, 8, 8, view.opened ? '#4ce07a' : '#1d3a2a')

  // Cuántas contraseñas se han probado, como marcas en el marco.
  label(context, `intentos: ${view.tried.length}`, 112, 122, 8, '#9aa7c4', 'center')

  rect(context, 4, 100, 150, 22, 'rgba(10,18,38,0.85)')
  label(
    context,
    `numero = ${last ?? '—'}   probar → ${view.opened ? 'True' : last !== undefined ? 'False' : '—'}`,
    10,
    115,
    8,
    '#e8f1ff',
  )
  if (view.opened && view.tried.length > VAULT_SECRET) {
    label(context, 'break', 214, 115, 8, '#ff9a9a', 'right')
  }
}

/** Lienzo de la caja fuerte: la rueda marca la última contraseña y la puerta cede al acertar. */
export function VaultScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const bornRef = useRef(0)
  const [view, setView] = useState<VaultView>(RESTING)

  useEffect(() => {
    aliveRef.current = true
    bornRef.current = performance.now()
    const context = canvasRef.current?.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    if (context) {
      const tick = (now: number) => {
        drawVault(context, view, now - bornRef.current, reduced)
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
      if (step.kind !== 'vault') continue
      if (!aliveRef.current) return
      setView({ tried: step.tried, opened: step.opened })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 480)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView(RESTING)
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.tried.length === 0
      ? 'La caja fuerte está cerrada y sin probar.'
      : `La caja fuerte está ${view.opened ? 'abierta' : 'cerrada'}. Contraseñas probadas: ${view.tried.join(', ')}.`

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
