import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { looksLikeWholeProgram, WHOLE_PROGRAM_WARNING } from '../app/clipboard'

interface CodeEditorProps {
  value: string
  onChange(value: string): void
  disabled?: boolean
  onWarning?(message: string): void
}

const INDENT = '    '

export function CodeEditor({ value, onChange, disabled = false, onWarning }: CodeEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Escape') {
      event.currentTarget.blur()
      return
    }

    if (event.key !== 'Tab') return

    event.preventDefault()
    const start = event.currentTarget.selectionStart
    const end = event.currentTarget.selectionEnd
    onChange(`${value.slice(0, start)}${INDENT}${value.slice(end)}`)

    requestAnimationFrame(() => {
      const target = ref.current
      if (!target) return
      target.selectionStart = start + INDENT.length
      target.selectionEnd = start + INDENT.length
    })
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    if (!looksLikeWholeProgram(event.clipboardData.getData('text'))) return
    onWarning?.(WHOLE_PROGRAM_WARNING)
  }

  return (
    <div className="editor">
      <label className="visually-hidden" htmlFor="codigo">
        Código Python del nivel
      </label>
      <textarea
        id="codigo"
        ref={ref}
        className="editor__area"
        value={value}
        rows={10}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />
      <p className="editor__note">Tab sangra. Escape sale del editor.</p>
    </div>
  )
}
