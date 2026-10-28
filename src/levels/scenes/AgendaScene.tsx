import { useCallback, useImperativeHandle, useState, type Ref } from 'react'
import { AGENDA_EXPECTED, AGENDA_START } from '../../engine/agenda'
import type { SceneHandle, SceneStep } from '../../engine/scene'
import { PixelCanvas } from '../../pixel/PixelCanvas'
import { COLORS } from '../../pixel/palette'
import {
  alpha,
  bevel,
  disc,
  dither,
  gradient,
  label,
  line,
  mix,
  panel,
  rand,
  rect,
  ring,
  starfield,
} from '../../pixel/shapes'
import { drawSprite, SPRITES } from '../../pixel/sprites'

interface AgendaView {
  contacts: { name: string; channel: string }[]
  sent: boolean
}

const RESTING: AgendaView = {
  contacts: AGENDA_START.map(([name, channel]) => ({ name, channel })),
  sent: false,
}

const CHANNEL_COLOURS = [COLORS.cyan, COLORS.gold, COLORS.violet, COLORS.lime]

/** Planeta rayado por filas enteras: bandas duras y borde de un píxel. */
function drawPlanet(context: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  const bands = ['#6a9ac8', '#5488b8', '#3f74a6', '#2f5f92', '#214a7a']
  for (let row = -radius; row <= radius; row += 1) {
    const half = Math.floor(Math.sqrt(radius * radius - row * row))
    const tone = bands[Math.min(bands.length - 1, Math.floor(((row + radius) / (radius * 2)) * bands.length))]
    rect(context, cx - half, cy + row, half * 2 + 1, 1, tone)
    if (row > 2) {
      const shade = Math.max(1, Math.round(half * 0.5))
      rect(context, cx + half - shade + 1, cy + row, shade, 1, alpha('#0b1226', 0.22))
    }
  }

  ring(context, cx, cy, radius, alpha(COLORS.ice, 0.22))
  rect(context, cx - 6, cy - 12, 4, 1, alpha(COLORS.ice, 0.45))
  rect(context, cx - 7, cy - 11, 1, 3, alpha(COLORS.ice, 0.3))
}

function drawCanopy(context: CanvasRenderingContext2D, time: number, reduced: boolean): void {
  bevel(context, 6, 8, 140, 62, '#1a2338', '#3d4c6a', '#0c1220', COLORS.ink)
  context.save()
  context.beginPath()
  context.rect(9, 11, 134, 56)
  context.clip()

  gradient(context, 9, 11, 134, 56, '#070b1c', '#1b2a4a', 8)
  starfield(context, 10, 12, 132, 54, COLORS.paper, 31, 34, time, reduced)

  drawPlanet(context, 101, 41, 17)
  line(context, 82, 30, 88, 32, alpha(COLORS.silver, 0.35))
  disc(context, 122, 22, 2, COLORS.silver)
  rect(context, 121, 21, 1, 1, '#5c6678')

  if (!reduced) {
    const glide = (time / 90) % 190
    rect(context, Math.round(12 + (glide % 130)), 58, 4, 1, alpha(COLORS.paper, 0.5))
  }

  for (let index = 0; index < 5; index += 1) {
    line(
      context,
      20 + index * 22,
      11,
      34 + index * 22,
      67,
      alpha(COLORS.paper, 0.025),
    )
  }
  context.restore()

  rect(context, 74, 8, 2, 62, '#2a3548')
  rect(context, 6, 36, 140, 2, '#2a3548')
  rect(context, 10, 12, 2, 22, alpha(COLORS.paper, 0.08))
  rect(context, 12, 12, 1, 14, alpha(COLORS.paper, 0.05))
  rect(context, 108, 12, 3, 2, '#5a6a84')
  rect(context, 108, 62, 3, 2, '#5a6a84')
}

function drawConsole(context: CanvasRenderingContext2D, view: AgendaView, time: number, reduced: boolean): void {
  bevel(context, 0, 94, 224, 34, '#1b2436', '#33425c', '#0d1420', COLORS.ink)
  rect(context, 0, 94, 224, 2, '#3d4c6a')
  rect(context, 0, 96, 224, 1, '#0d1420')

  panel(context, 6, 100, 62, 16, '#0a1220', '#2b3d66')
  label(context, 'ENVIAR AGENDA', 12, 106, 5, COLORS.cyan)
  panel(context, 6, 110, 34, 5, view.sent ? 'rgba(47,107,58,0.7)' : 'rgba(43,61,102,0.9)', view.sent ? COLORS.lime : '#4a6a8a')
  label(context, view.sent ? 'ENVIADA' : 'SIN ENVIAR', 12, 114, 4, view.sent ? COLORS.lime : '#8fa3cc')

  for (let index = 0; index < 4; index += 1) {
    disc(context, 48 + index * 5, 113, 1, index === 1 ? COLORS.gold : '#2b3d66')
  }

  panel(context, 74, 100, 62, 16, '#0a1220', '#2b3d66')
  label(context, 'AGENDA', 80, 106, 5, '#8fa3cc')
  label(
    context,
    `${view.contacts.length}/4 PUNTOS`,
    130,
    106,
    4,
    view.sent ? COLORS.lime : COLORS.gold,
    'right',
  )
  for (let index = 0; index < 4; index += 1) {
    rect(context, 80 + index * 12, 110, 8, 4, view.contacts[index] ? alpha(COLORS.cyan, 0.7) : '#1b2a4a')
  }

  for (let index = 0; index < 3; index += 1) {
    const glow = reduced ? 0.5 : 0.3 + 0.35 * Math.sin(time / 300 + index * 2)
    context.globalAlpha = glow
    rect(context, 144 + index * 4, 112, 2, 2, index === 0 ? COLORS.lime : COLORS.cyan)
    context.globalAlpha = 1
  }

  rect(context, 158, 100, 36, 18, '#121a2a')
  rect(context, 158, 100, 36, 1, '#2b3d66')
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      rect(context, 160 + column * 4, 103 + row * 4, 3, 3, (row + column) % 3 === 0 ? '#233350' : '#182338')
    }
  }

  rect(context, 198, 102, 22, 20, '#121a2a')
  rect(context, 198, 102, 22, 1, '#33425c')
  rect(context, 201, 106, 16, 8, '#080e18')
  const blip = reduced ? 0.6 : 0.4 + 0.3 * Math.sin(time / 240)
  context.globalAlpha = blip
  line(context, 203, 112, 209, 108, COLORS.lime)
  line(context, 209, 108, 214, 110, COLORS.lime)
  context.globalAlpha = 1
  label(context, 'COM', 209, 120, 4, '#8fa3cc', 'center')
}

function drawAgendaPanel(
  context: CanvasRenderingContext2D,
  view: AgendaView,
  time: number,
  reduced: boolean,
): void {
  const pulse = reduced ? 1 : 0.72 + 0.28 * Math.sin(time / 420)

  rect(context, 154, 14, 62, 78, alpha(COLORS.ink, 0.5))
  panel(context, 152, 10, 66, 80, 'rgba(7,18,32,0.85)', view.sent ? COLORS.teal : '#2b3d66')
  rect(context, 152, 10, 66, 1, view.sent ? alpha(COLORS.teal, 0.8) : '#3d5c8a')

  context.globalAlpha = view.sent ? pulse : 0.7
  label(context, 'AGENDA', 158, 21, 7, view.sent ? COLORS.teal : COLORS.cyan)
  context.globalAlpha = 1
  label(context, view.sent ? 'ENVIADA' : 'BORRADOR', 212, 20, 4, view.sent ? COLORS.lime : '#8fa3cc', 'right')
  rect(context, 158, 24, 54, 1, alpha(COLORS.cyan, 0.3))

  const rows = view.sent
    ? view.contacts
    : [
        ...view.contacts,
        ...(view.contacts.length < AGENDA_EXPECTED.length
          ? [{ name: 'cocina', channel: 'comedor' }]
          : []),
      ]

  rows.forEach((contact, index) => {
    const y = 29 + index * 13
    const ghost = !view.sent && index >= view.contacts.length
    const colour = ghost ? '#3d5c8a' : CHANNEL_COLOURS[index % CHANNEL_COLOURS.length]!
    const fresh = view.sent && index === rows.length - 1

    if (fresh) {
      context.globalAlpha = reduced ? 0.5 : 0.28 + 0.2 * Math.sin(time / 280)
      rect(context, 155, y, 60, 11, alpha(COLORS.teal, 0.35))
      context.globalAlpha = 1
    }

    rect(context, 158, y + 2, 3, 7, ghost ? '#253a5c' : colour)
    if (!ghost) {
      rect(context, 158, y + 2, 3, 2, mix(colour, COLORS.paper, 0.35))
    }
    label(context, contact.name.toUpperCase(), 164, y + 8, 5, ghost ? '#4f6a96' : '#d7e4ff')
    if (ghost) {
      label(context, '· · ·', 206, y + 8, 5, '#4f6a96', 'right')
    } else {
      label(context, contact.channel, 211, y + 8, 5, alpha(colour, 0.95), 'right')
    }
    if (index < rows.length - 1) {
      rect(context, 158, y + 11, 54, 1, alpha(COLORS.cyan, 0.08))
    }
  })

  rect(context, 158, 80, 54, 1, alpha(COLORS.cyan, 0.25))
  label(
    context,
    view.sent ? `${view.contacts.length}/4 · EN EL PUENTE` : `${view.contacts.length}/4 · FALTA COCINA`,
    158,
    87,
    4,
    view.sent ? COLORS.lime : '#8fa3cc',
  )

  line(context, 185, 94, 160, 80, alpha(COLORS.teal, 0.18))
  line(context, 185, 94, 210, 80, alpha(COLORS.teal, 0.18))
  dither(context, 160, 70, 52, 20, alpha(COLORS.teal, 0.06), 3)

  if (view.sent) {
    const beam = reduced ? 0.55 : 0.35 + 0.25 * Math.sin(time / 200)
    context.globalAlpha = beam
    for (let index = 0; index < 3; index += 1) {
      const rise = reduced ? index * 4 : (time / 90 + index * 5) % 10
      rect(context, 181 + index * 4, 10 - rise, 1, 2, index === 1 ? COLORS.lime : COLORS.teal)
    }
    context.globalAlpha = 1
  }
}

function drawBridge(
  context: CanvasRenderingContext2D,
  view: AgendaView,
  time: number,
  reduced: boolean,
): void {
  gradient(context, 0, 0, 224, 128, '#0b1226', '#141d33', 8)
  dither(context, 0, 0, 224, 94, alpha(COLORS.ink, 0.18), 4)

  delimit(context)

  drawCanopy(context, time, reduced)
  drawSprite(context, SPRITES.captain, 34, 62, { scale: 2 })
  rect(context, 32, 92, 28, 2, alpha(COLORS.ink, 0.4))

  drawConsole(context, view, time, reduced)
  drawAgendaPanel(context, view, time, reduced)

  if (!reduced) {
    for (let index = 0; index < 8; index += 1) {
      const progress = (time / 4600 + rand(index + 17)) % 1
      context.globalAlpha = 0.18 * (1 - progress)
      rect(
        context,
        Math.round(10 + rand(index + 61) * 204),
        Math.round(10 + progress * 80),
        1,
        1,
        COLORS.ice,
      )
    }
    context.globalAlpha = 1
  }
}

/** Cornisas que sujetan la cúpula: dos aristas para que el puente no flote. */
function delimit(context: CanvasRenderingContext2D): void {
  rect(context, 0, 0, 224, 4, '#080d18')
  rect(context, 0, 0, 224, 1, '#2a3548')
  for (let x = 8; x < 224; x += 24) {
    rect(context, x, 1, 2, 2, '#1b2436')
  }
}

/** Lienzo del puente: la cúpula estrellada y la agenda holográfica de los puestos. */
export function AgendaScene({ ref }: { ref?: Ref<SceneHandle> }) {
  const [view, setView] = useState<AgendaView>(RESTING)

  const draw = useCallback(
    (context: CanvasRenderingContext2D, time: number, reduced: boolean) => {
      drawBridge(context, view, time, reduced)
    },
    [view],
  )

  const play = useCallback(async (steps: SceneStep[]) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    for (const step of steps) {
      if (step.kind !== 'agenda') continue
      setView({ contacts: step.contacts, sent: step.sent })
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, reduced ? 0 : 320)
      })
    }
  }, [])

  const reset = useCallback(() => setView(RESTING), [])
  useImperativeHandle(ref, () => ({ play, reset }), [play, reset])

  const description = view.sent
    ? `La agenda ha llegado al puente con ${view.contacts.length} puestos: ${view.contacts
        .map((contact) => `${contact.name} por ${contact.channel}`)
        .join(', ')}.`
    : `La agenda tiene ${view.contacts.length} puestos: ${view.contacts
        .map((contact) => `${contact.name} por ${contact.channel}`)
        .join(', ')}. Falta apuntar la cocina.`

  return <PixelCanvas label={description} draw={draw} />
}
