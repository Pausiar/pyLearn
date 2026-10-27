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

function drawVault(context: CanvasRenderingContext2D, view: VaultView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#12161f')
  rect(context, 6, 16, 92, 96, '#2a3346')
  rect(context, 12, 22, 80, 84, view.opened ? '#1f5c38' : '#3b4761')
  rect(context, 46, 40, 10, 10, view.opened ? '#30d158' : '#8f97ad')
  rect(context, 46, 60, 10, 10, view.opened ? '#30d158' : '#8f97ad')
  rect(context, 46, 80, 10, 10, view.opened ? '#30d158' : '#8f97ad')
  label(context, view.opened ? 'ABIERTA' : 'CERRADA', 52, 118, 10, view.opened ? '#8de08f' : '#c8cede')

  for (let index = 0; index < VAULT_TRIES; index += 1) {
    const numero = index + 1
    const y = 12 + index * 17
    const probado = view.tried.includes(numero)
    const acierto = probado && numero === VAULT_SECRET

    rect(context, 108, y, 44, 15, acierto ? '#1f5c38' : probado ? '#3a2b33' : '#232a3d')
    label(context, `${probado ? (acierto ? '✓' : '✗') : '·'} ${numero}`, 116, y + 11, 9, '#e8f1ff')
  }

  label(context, `Intentos: ${view.tried.length}`, 108, 122, 8, '#9aa7c4')

  if (view.opened && view.tried.length > VAULT_SECRET) {
    label(context, 'Sobraban intentos: usa break', 52, 128, 8, '#ff9a9a', 'center')
  }
}

/** Lienzo de la caja fuerte: qué contraseñas se han probado y si cedió. */
export function VaultScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<VaultView>({ tried: [], opened: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawVault(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'vault') continue
      if (!aliveRef.current) return
      setView({ tried: step.tried, opened: step.opened })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ tried: [], opened: false })
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
