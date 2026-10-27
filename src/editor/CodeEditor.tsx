import { useRef, type KeyboardEvent } from 'react'

interface CodeEditorProps {
  value: string
  onChange(value: string): void
  disabled?: boolean
}

const INDENT = '    '

export function CodeEditor({ value, onChange, disabled = false }: CodeEditorProps) {
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
      />
      <p className="editor__note">Tab sangra. Escape sale del editor.</p>
    </div>
  )
}
