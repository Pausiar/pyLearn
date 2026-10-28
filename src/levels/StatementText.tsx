import { useMemo } from 'react'
import { splitStatement } from './statement'

export function StatementText({ text }: { text: string }) {
  const parts = useMemo(() => splitStatement(text), [text])

  return (
    <>
      {parts.map((part, index) =>
        part.code ? (
          <code className="statement-code" key={index}>
            {part.text}
          </code>
        ) : (
          part.text
        ),
      )}
    </>
  )
}
