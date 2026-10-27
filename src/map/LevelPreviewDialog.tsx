import { useEffect, useRef } from 'react'
import type { LevelSummary } from '../levels/catalog'

interface LevelPreviewDialogProps {
  level: LevelSummary | null
  onClose(): void
}

export function LevelPreviewDialog({ level, onClose }: LevelPreviewDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return

    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)

    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (level && !dialog.open) dialog.showModal()
    if (!level && dialog.open) dialog.close()
  }, [level])

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="preview-title">
      {level ? (
        <div className="sheet__body">
          <h2 id="preview-title">{`Nivel ${level.id}: ${level.title}`}</h2>
          <p>
            <strong>Aprenderás</strong> {level.concept}.
          </p>
          <p>
            <strong>Minijuego</strong> {level.game}.
          </p>
          <p className="sheet__note">Este nivel se construye en una fase posterior del proyecto.</p>
          <div className="sheet__actions">
            <button type="button" className="btn btn--primary" onClick={onClose}>
              Entendido
            </button>
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
