import { useEffect, useRef, useState } from 'react'
import type { Progress } from '../app/progress'
import { navigate } from '../app/router'
import type { LevelSummary } from '../levels/catalog'
import { HexMap } from './HexMap'
import { LevelPreviewDialog } from './LevelPreviewDialog'

/** Fase 0: solo el nivel 1 está construido. El resto abre su ficha informativa. */
const PLAYABLE = new Set([1])

export function MapScreen({ progress }: { progress: Progress }) {
  const [preview, setPreview] = useState<LevelSummary | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  function handlePick(level: LevelSummary) {
    if (PLAYABLE.has(level.id)) {
      navigate({ name: 'level', id: level.id })
      return
    }
    setPreview(level)
  }

  return (
    <main className="shell">
      <header className="page-head">
        <h1 ref={headingRef} tabIndex={-1}>
          Tu camino
        </h1>
        <p>Cuarenta niveles, ocho mundos. Empieza por el primero.</p>
      </header>

      <HexMap progress={progress} onPick={handlePick} />
      <LevelPreviewDialog level={preview} onClose={() => setPreview(null)} />
    </main>
  )
}
