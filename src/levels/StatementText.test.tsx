// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { StatementText } from './StatementText'

afterEach(cleanup)

describe('StatementText', () => {
  it('pinta el código aparte y conserva todo el texto', () => {
    const text = 'Usa print("SOS") y deja «Hora 6: Riego».'
    const { container } = render(
      <p>
        <StatementText text={text} />
      </p>,
    )

    expect(container.querySelector('code.statement-code')?.textContent).toBe('print("SOS")')
    expect(container.textContent).toBe(text)
  })
})
