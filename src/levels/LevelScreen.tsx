import { useEffect, useRef, useState, type ClipboardEvent } from 'react'
import { DECOY_TEXT } from '../app/clipboard'
import { applyRun, type Progress } from '../app/progress'
import { Console, type ConsoleTone } from '../editor/Console'
import { CodeEditor } from '../editor/CodeEditor'
import type { SceneHandle } from '../engine/scene'
import { run as runProgram } from '../interp/run'
import { levelById, worldById } from './catalog'
import { playableLevel } from './registry'
import { starsForLines } from './stars'
import type { PlayableLevel } from './types'

interface LevelScreenProps {
  levelId: number
  progress: Progress
  onChange(progress: Progress): void
}

interface Message {
  tone: ConsoleTone
  text: string
}

const RECOVERY = '\nTe has quedado sin vidas. Vuelves a empezar con 3 vidas.'

/** Copiar el enunciado no copia el enunciado: deja una frase de broma en el portapapeles. */
function handleStatementCopy(event: ClipboardEvent<HTMLElement>) {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return
  if (!event.currentTarget.contains(selection.anchorNode)) return

  event.preventDefault()
  event.clipboardData.setData('text/plain', DECOY_TEXT)
}

export function LevelScreen(props: LevelScreenProps) {
  const level = playableLevel(props.levelId)

  if (!level) return <Unavailable levelId={props.levelId} />

  return (
    <PlayableScreen
      key={level.id}
      level={level}
      progress={props.progress}
      onChange={props.onChange}
    />
  )
}

function Unavailable({ levelId }: { levelId: number }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const summary = levelById(levelId)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [levelId])

  return (
    <main className="shell">
      <header className="page-head">
        <h1 ref={headingRef} tabIndex={-1}>
          {`Nivel ${levelId}: ${summary?.title ?? ''}`}
        </h1>
        <p>Este nivel llega en una próxima entrega. Ya puedes jugar los veinte primeros.</p>
      </header>
      <a className="btn btn--secondary" href="#/">
        Volver al mapa
      </a>
    </main>
  )
}

function PlayableScreen({
  level,
  progress,
  onChange,
}: {
  level: PlayableLevel
  progress: Progress
  onChange(progress: Progress): void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const sceneRef = useRef<SceneHandle>(null)
  const [code, setCode] = useState(level.starter)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<Message>({ tone: 'idle', text: '' })

  const summary = levelById(level.id)
  const world = summary ? worldById(summary.world) : undefined
  const Scene = level.Scene

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [level.id])

  async function run() {
    if (running) return
    setRunning(true)
    setMessage({ tone: 'idle', text: 'Ejecutando tu programa.' })
    sceneRef.current?.reset()

    const session = level.start()
    const result = runProgram(code, session.api)
    const outcome = session.finish(result, code)
    await sceneRef.current?.play(outcome.steps)

    const printed = result.output.length > 0 ? `${result.output.join('\n')}\n` : ''

    if (result.error) {
      const applied = applyRun(progress, level.id, { failed: true })
      onChange(applied.progress)
      setMessage({
        tone: 'error',
        text: `${printed}Línea ${result.error.line}: ${result.error.message}${applied.recovered ? RECOVERY : ''}`,
      })
      setRunning(false)
      return
    }

    if (outcome.complete) {
      const stars = starsForLines(result.lines, level.par)
      onChange(applyRun(progress, level.id, { stars }).progress)
      const tip =
        stars < 3 ? `\nPrueba con ${level.par} líneas o menos para las 3 estrellas.` : ''
      setMessage({
        tone: 'ok',
        text: `${printed}${level.success} ${stars} de 3 estrellas (${result.lines} líneas).${tip}`,
      })
      setRunning(false)
      return
    }

    const applied = applyRun(progress, level.id, { failed: true })
    onChange(applied.progress)
    setMessage({
      tone: 'error',
      text: `${printed}${outcome.missing}${applied.recovered ? RECOVERY : ''}`,
    })
    setRunning(false)
  }

  function restart() {
    if (running) return
    sceneRef.current?.reset()
    setMessage({ tone: 'idle', text: '' })
  }

  return (
    <main className="shell level">
      <header className="level__head" onCopy={handleStatementCopy}>
        <h1 ref={headingRef} tabIndex={-1}>
          {`Nivel ${level.id}: ${level.title}`}
        </h1>
        <p className="level__meta">{`Mundo ${world?.id ?? 1}: ${world?.title ?? 'Despegue'}. ${level.concept}.`}</p>
        <p className="level__story">{level.story}</p>
        <details className="hint">
          <summary>Pista</summary>
          <p>{level.hint}</p>
        </details>
      </header>

      <div className="work">
        <section className="panel" aria-labelledby="scene-title">
          <h2 id="scene-title">{level.sceneTitle}</h2>
          <Scene ref={sceneRef} />
        </section>

        <section className="panel" aria-labelledby="code-title">
          <h2 id="code-title">Tu código Python</h2>
          <CodeEditor
            value={code}
            onChange={setCode}
            disabled={running}
            onWarning={(text) => setMessage({ tone: 'error', text })}
          />

          <div className="actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void run()}
              disabled={running}
            >
              {running ? 'Ejecutando' : 'Ejecutar'}
            </button>
            <button type="button" className="btn btn--secondary" onClick={restart} disabled={running}>
              Reiniciar campo
            </button>
          </div>

          <Console tone={message.tone} text={message.text} />
        </section>
      </div>
    </main>
  )
}
