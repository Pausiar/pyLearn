import { useEffect, useRef, useState, type ClipboardEvent } from 'react'
import { DECOY_TEXT } from '../app/clipboard'
import { applyRun, type Progress } from '../app/progress'
import { Console, type ConsoleTone } from '../editor/Console'
import { CodeEditor } from '../editor/CodeEditor'
import {
  CROPS,
  createApi,
  createField,
  isComplete,
  wateredCount,
  type DroneAction,
} from '../engine/drone'
import { run as runProgram } from '../interp/run'
import { DroneField, type DroneFieldHandle } from './DroneField'
import { LEVEL_01, starsForLines } from './level01'
import { levelById } from './catalog'

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

export function LevelScreen({ levelId, progress, onChange }: LevelScreenProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const sceneRef = useRef<DroneFieldHandle>(null)
  const [code, setCode] = useState(LEVEL_01.starter)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState<Message>({ tone: 'idle', text: '' })

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [levelId])

  if (levelId !== LEVEL_01.id) {
    const other = levelById(levelId)
    return (
      <main className="shell">
        <header className="page-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {`Nivel ${levelId}: ${other?.title ?? ''}`}
          </h1>
          <p>Este nivel llega en la siguiente entrega. Mientras tanto, el nivel 1 ya se juega.</p>
        </header>
        <a className="btn btn--secondary" href="#/">
          Volver al mapa
        </a>
      </main>
    )
  }

  async function run() {
    if (running) return
    setRunning(true)
    setMessage({ tone: 'idle', text: 'Ejecutando tu programa.' })
    sceneRef.current?.reset()

    const field = createField()
    const actions: DroneAction[] = []
    const result = runProgram(code, createApi(field, actions))
    await sceneRef.current?.play(actions)

    const printed = result.output.length > 0 ? `${result.output.join('\n')}\n` : ''

    if (result.error) {
      const applied = applyRun(progress, LEVEL_01.id, { failed: true })
      onChange(applied.progress)
      setMessage({
        tone: 'error',
        text: `${printed}Línea ${result.error.line}: ${result.error.message}${applied.recovered ? RECOVERY : ''}`,
      })
      setRunning(false)
      return
    }

    if (isComplete(field)) {
      const stars = starsForLines(result.lines)
      onChange(applyRun(progress, LEVEL_01.id, { stars }).progress)
      const tip = stars < 3 ? '\nPrueba con 8 líneas o menos para las 3 estrellas.' : ''
      setMessage({
        tone: 'ok',
        text: `${printed}Cultivos regados. ${stars} de 3 estrellas (${result.lines} líneas).${tip}`,
      })
      setRunning(false)
      return
    }

    const applied = applyRun(progress, LEVEL_01.id, { failed: true })
    onChange(applied.progress)
    const missing = CROPS.length - wateredCount(field)
    const what = missing === 1 ? 'Falta 1 cultivo por regar.' : `Faltan ${missing} cultivos por regar.`
    setMessage({
      tone: 'error',
      text: `${printed}${what} Avanza hasta cada planta y riega.${applied.recovered ? RECOVERY : ''}`,
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
          Nivel 1: Primer vuelo
        </h1>
        <p className="level__meta">Mundo 1: Despegue. Instrucciones en secuencia.</p>
        <p className="level__story">{LEVEL_01.story}</p>
        <details className="hint">
          <summary>Pista</summary>
          <p>{LEVEL_01.hint}</p>
        </details>
      </header>

      <div className="work">
        <section className="panel" aria-labelledby="field-title">
          <h2 id="field-title">El campo</h2>
          <DroneField ref={sceneRef} />
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
