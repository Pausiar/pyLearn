import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { CloseIcon } from './icons'
import { parseProgress, serializeProgress, totalStars, type Progress } from './progress'
import { THEME_LABELS, type ThemePreference } from './theme'

interface SettingsDialogProps {
  open: boolean
  onClose(): void
  theme: ThemePreference
  onThemeChange(theme: ThemePreference): void
  progress: Progress
  onImport(progress: Progress): void
  onReset(): void
}

const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark']

interface Notice {
  tone: 'ok' | 'error'
  text: string
}

export function SettingsDialog({
  open,
  onClose,
  theme,
  onThemeChange,
  progress,
  onImport,
  onReset,
}: SettingsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [confirming, setConfirming] = useState(false)

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
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (open) return
    setNotice(null)
    setConfirming(false)
  }, [open])

  function exportProgress() {
    const blob = new Blob([serializeProgress(progress)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pylearn-progreso.json'
    link.click()
    URL.revokeObjectURL(url)
    setNotice({ tone: 'ok', text: 'Progreso exportado.' })
  }

  async function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    const parsed = parseProgress(await file.text())
    if (!parsed) {
      setNotice({ tone: 'error', text: 'Ese archivo no tiene un progreso de PyLearn.' })
      return
    }

    onImport(parsed)
    setNotice({ tone: 'ok', text: 'Progreso importado.' })
  }

  function resetProgress() {
    onReset()
    setConfirming(false)
    setNotice({ tone: 'ok', text: 'Progreso borrado en este navegador.' })
  }

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="settings-title">
      <div className="sheet__head">
        <h2 id="settings-title">Ajustes</h2>
        <button type="button" className="icon-button" onClick={onClose}>
          <CloseIcon />
          <span className="visually-hidden">Cerrar</span>
        </button>
      </div>

      <div className="sheet__body">
        <fieldset className="fieldset">
          <legend>Tema</legend>
          <div className="fieldset__options">
            {THEME_OPTIONS.map((option) => (
              <label key={option} className="choice">
                <input
                  type="radio"
                  name="tema"
                  value={option}
                  checked={theme === option}
                  onChange={() => onThemeChange(option)}
                />
                <span>{THEME_LABELS[option]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="settings__block" aria-labelledby="progress-title">
          <h3 id="progress-title">Progreso</h3>
          <p className="settings__summary">
            {`${totalStars(progress)} estrellas en ${Object.keys(progress.stars).length} niveles. Guardado solo en este navegador.`}
          </p>

          <div className="settings__row">
            <button type="button" className="btn btn--secondary" onClick={exportProgress}>
              Exportar
            </button>
            <input
              className="file-input"
              type="file"
              accept="application/json,.json"
              aria-label="Importar progreso desde un archivo JSON"
              onChange={(event) => void importProgress(event)}
            />
          </div>

          {notice ? (
            <p className={`settings__notice settings__notice--${notice.tone}`} role="status">
              {notice.text}
            </p>
          ) : null}

          {confirming ? (
            <div className="settings__confirm">
              <p>Se borran las estrellas y las vidas guardadas en este navegador.</p>
              <div className="settings__row">
                <button type="button" className="btn btn--danger" onClick={resetProgress}>
                  Borrar todo
                </button>
                <button
                  type="button"
                  className="btn btn--quiet"
                  onClick={() => setConfirming(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => setConfirming(true)}
            >
              Borrar progreso
            </button>
          )}
        </section>
      </div>
    </dialog>
  )
}
