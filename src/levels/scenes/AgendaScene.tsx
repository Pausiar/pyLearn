import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { label, rect } from '../../pixel/shapes'

const WIDTH = 224
const HEIGHT = 128
/** El lienzo se dibuja al doble para que el texto salga nítido al mostrarlo a 448 px. */
const SCALE = 2

interface AgendaView {
  contacts: { name: string; channel: string }[]
  sent: boolean
}

function drawAgenda(context: CanvasRenderingContext2D, view: AgendaView): void {
  context.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  context.clearRect(0, 0, WIDTH, HEIGHT)

  rect(context, 0, 0, WIDTH, HEIGHT, '#101a2c')
  rect(context, 0, 0, WIDTH, 18, '#1b2942')
  label(context, 'CONSOLA · AGENDA', 8, 6, 10, '#8fb7ff')
  label(
    context,
    view.sent ? 'ENVIADA' : 'SIN ENVIAR',
    216,
    6,
    10,
    view.sent ? '#8fd3a6' : '#ffb648',
    'right',
  )

  view.contacts.forEach((contact, index) => {
    const y = 26 + index * 19
    rect(context, 8, y, 208, 15, index % 2 === 0 ? '#16223a' : '#1b2a46')
    rect(context, 8, y, 3, 15, '#4a8fe7')
    label(context, contact.name.toUpperCase(), 18, y + 4, 10, '#d7e4ff')
    label(context, '->', 148, y + 4, 10, '#5f7595')
    label(context, contact.channel, 212, y + 4, 10, '#ffd479', 'right')
  })

  const pending = 4 - view.contacts.length
  label(
    context,
    pending > 0 ? `Faltan ${pending} puestos por apuntar` : 'Agenda completa',
    8,
    112,
    9,
    pending > 0 ? '#9aa8c2' : '#8fd3a6',
  )
}

/** Lienzo de la agenda de la nave: los puestos, sus canales y si ya está enviada. */
export function AgendaScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aliveRef = useRef(true)
  const [view, setView] = useState<AgendaView>({ contacts: [], sent: false })

  useEffect(() => {
    aliveRef.current = true
    const context = canvasRef.current?.getContext('2d')
    if (context) drawAgenda(context, view)

    return () => {
      aliveRef.current = false
    }
  }, [view])

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    for (const step of steps) {
      if (step.kind !== 'agenda') continue
      if (!aliveRef.current) return
      setView({ contacts: step.contacts, sent: step.sent })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => {
    setView({ contacts: [], sent: false })
  }, [])

  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description =
    view.contacts.length === 0
      ? 'La agenda de la nave está vacía.'
      : `La agenda tiene ${view.contacts.length} puestos: ${view.contacts
          .map((contact) => `${contact.name} por ${contact.channel}`)
          .join(', ')}.${view.sent ? ' Ya ha llegado al puente.' : ''}`

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
