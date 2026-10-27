export type ConsoleTone = 'idle' | 'ok' | 'error'

interface ConsoleProps {
  tone: ConsoleTone
  text: string
}

export function Console({ tone, text }: ConsoleProps) {
  return (
    <div className={`console console--${tone}`} role="status">
      {text === '' ? 'Ejecuta tu código para ver el resultado.' : text}
    </div>
  )
}
