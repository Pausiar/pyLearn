import { useEffect, useRef, useState } from 'react'
import { currentLevel, type Progress } from '../app/progress'
import { navigate } from '../app/router'
import { levelById, worldById, type LevelSummary } from '../levels/catalog'
import { isPlayable } from '../levels/registry'
import { HexMap } from './HexMap'
import { LevelPreviewDialog } from './LevelPreviewDialog'

export function MapScreen({ progress }: { progress: Progress }) {
  const [preview, setPreview] = useState<LevelSummary | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const current = currentLevel(progress)
  const level = levelById(current)
  const world = level ? worldById(level.world) : undefined

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  function handlePick(picked: LevelSummary) {
    if (isPlayable(picked.id)) {
      navigate({ name: 'level', id: picked.id })
      return
    }
    setPreview(picked)
  }

  return (
    <main className="shell map">
      <h1 className="visually-hidden" ref={headingRef} tabIndex={-1}>
        Tu camino
      </h1>

      <div className="map__banner">
        <p className="map__eyebrow">{`Mundo ${world?.id ?? 1}: ${world?.title ?? 'Despegue'}`}</p>
        <p className="map__title">{`Nivel ${level?.id ?? current}: ${level?.title ?? ''}`}</p>
      </div>

      <HexMap progress={progress} onPick={handlePick} />
      <LevelPreviewDialog level={preview} onClose={() => setPreview(null)} />
    </main>
  )
}
