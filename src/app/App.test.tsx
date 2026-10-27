// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'

beforeEach(() => {
  cleanup()
  window.localStorage.clear()
  window.location.hash = '#/'
  Element.prototype.scrollIntoView = vi.fn()
  window.scrollTo = vi.fn()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('aplicación', () => {
  it('pinta el mapa con los cuarenta niveles', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Tu camino' })).toBeTruthy()
    expect(screen.getAllByLabelText(/^Nivel \d+/)).toHaveLength(40)
    expect(screen.getByLabelText(/^Nivel 1:/)).toBeTruthy()
  })

  it('pinta el nivel 1 con su editor y su campo', () => {
    window.location.hash = '#/nivel/1'

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Nivel 1: Primer vuelo' })).toBeTruthy()
    expect(screen.getByLabelText('Código Python del nivel')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ejecutar' })).toBeTruthy()
    expect(screen.getByRole('img', { name: /El dron está en la casilla 0/ })).toBeTruthy()
  })

  it('abre la ficha de un nivel que todavía no existe', () => {
    window.location.hash = '#/nivel/21'

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Nivel 21: El truco nuevo' })).toBeTruthy()
    expect(screen.getByText(/llega en una próxima entrega/)).toBeTruthy()
  })
})
