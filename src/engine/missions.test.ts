import { describe, expect, it } from 'vitest'
import { run } from '../interp/run'
import { createBackpack, createBackpackApi, judgeBackpack } from './backpack'
import { judgeLighthouse, lighthouseSteps } from './lighthouse'
import { createSign, createSignApi, judgeSign } from './signs'

describe('faro', () => {
  it('se conforma solo con los tres mensajes en orden', () => {
    expect(judgeLighthouse(['SOS', 'PYLEARN', 'AYUDA']).complete).toBe(true)
  })

  it('avisa si falta algún mensaje', () => {
    const verdict = judgeLighthouse(['SOS'])

    expect(verdict.complete).toBe(false)
    expect(verdict.missing).toContain('«SOS»')
    expect(verdict.missing).toContain('«AYUDA»')
  })

  it('no acepta los mensajes en otro orden', () => {
    expect(judgeLighthouse(['SOS', 'AYUDA', 'PYLEARN']).complete).toBe(false)
  })

  it('pide el primer mensaje si no se ha enviado nada', () => {
    expect(judgeLighthouse([]).missing).toContain('El faro sigue apagado')
  })

  it('deja un paso por mensaje, más el inicial', () => {
    expect(lighthouseSteps(['SOS', 'PYLEARN'])).toHaveLength(3)
    expect(lighthouseSteps(['SOS'])[1]?.lines).toEqual(['SOS'])
  })
})

describe('mochila', () => {
  it('se completa con 3 cuerdas y 2 cantimploras', () => {
    const state = createBackpack()
    const api = createBackpackApi(state)
    api.mochila?.(3, 2)

    expect(judgeBackpack(state).complete).toBe(true)
  })

  it('avisa si la mochila sigue vacía', () => {
    expect(judgeBackpack(createBackpack()).missing).toContain('vacía')
  })

  it('no acepta cantidades negativas', () => {
    const api = createBackpackApi(createBackpack())
    expect(() => api.mochila?.(-1, 2)).toThrowError('No puedes meter cantidades negativas en la mochila')
  })

  it('no acepta más de lo que cabe', () => {
    const api = createBackpackApi(createBackpack())
    expect(() => api.mochila?.(5, 2)).toThrowError('En la mochila solo caben 6 cosas')
  })

  it('no acepta decimales', () => {
    const api = createBackpackApi(createBackpack())
    expect(() => api.mochila?.(1.5, 2)).toThrowError('Las cantidades de la mochila tienen que ser números enteros')
  })

  it('convierte el error en una línea del programa', () => {
    const session = createBackpackApi(createBackpack())
    const result = run('mochila(9, 1)', session)

    expect(result.error?.line).toBe(1)
    expect(result.error?.message).toBe('En la mochila solo caben 6 cosas')
  })
})

describe('letrero', () => {
  it('se enciende con el texto exacto', () => {
    const state = createSign()
    const api = createSignApi(state)
    api.letrero?.('ABIERTO NEÓN 24H')

    expect(judgeSign(state).complete).toBe(true)
  })

  it('se queda apagado sin llamada', () => {
    expect(judgeSign(createSign()).missing).toContain('apagado')
  })

  it('no acepta un texto vacío', () => {
    const api = createSignApi(createSign())
    expect(() => api.letrero?.('   ')).toThrowError('El letrero está vacío: escribe algo entre comillas')
  })

  it('no acepta números', () => {
    const api = createSignApi(createSign())
    expect(() => api.letrero?.(3)).toThrowError('letrero() necesita un texto entre comillas')
  })

  it('dice qué muestra el letrero cuando no es el texto pedido', () => {
    const state = createSign()
    const api = createSignApi(state)
    api.letrero?.('CERRADO')

    expect(judgeSign(state).missing).toContain('«CERRADO»')
    expect(judgeSign(state).missing).toContain('«ABIERTO NEÓN 24H»')
  })
})
