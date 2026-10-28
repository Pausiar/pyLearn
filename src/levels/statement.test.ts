import { describe, expect, it } from 'vitest'
import { splitStatement } from './statement'

function codeSpans(text: string): string[] {
  return splitStatement(text)
    .filter((part) => part.code)
    .map((part) => part.text)
}

describe('splitStatement', () => {
  it('deja el texto sin código tal cual', () => {
    const text = 'El dron está en el hangar y espera su turno.'
    expect(splitStatement(text)).toEqual([{ code: false, text }])
  })

  it('marca llamadas y firmas', () => {
    expect(codeSpans('Escribe avanzar() y regar() al final.')).toEqual(['avanzar()', 'regar()'])
    expect(codeSpans('Define preparar(sabor, cantidad=1) y entrégala.')).toEqual([
      'preparar(sabor, cantidad=1)',
    ])
  })

  it('marca asignaciones con literales', () => {
    expect(codeSpans('En el editor: agenda = {"mando": "puente"} y nada más.')).toEqual([
      'agenda = {"mando": "puente"}',
    ])
    expect(codeSpans('Guarda ficha = ("gol", 1) y sigue.')).toEqual(['ficha = ("gol", 1)'])
    expect(codeSpans('Vacía ligera = [] antes del bucle.')).toEqual(['ligera = []'])
  })

  it('marca cabeceras de bloque completas', () => {
    expect(codeSpans('Recorre con for i in range(100): y riega.')).toEqual([
      'for i in range(100):',
    ])
    expect(codeSpans('Abre con with open("diario.txt", "w") as diario: y escribe.')).toEqual([
      'with open("diario.txt", "w") as diario:',
    ])
  })

  it('no marca palabras españolas que contienen claves', () => {
    expect(codeSpans('La contraseña así que el índice -1.')).toEqual([])
  })

  it('no inventa código alrededor de un and suelto', () => {
    expect(codeSpans('las dos unidas con and para que sea True')).toEqual(['and', 'True'])
  })

  it('no toca la salida esperada entre comillas latinas', () => {
    expect(codeSpans('Tiene que salir «Cemento: True» y «Furgón: False».')).toEqual([])
  })

  it('marca comparaciones, operadores y errores', () => {
    expect(codeSpans('Comprueba edad > 12 y que no salte ValueError.')).toEqual([
      'edad > 12',
      'ValueError',
    ])
    expect(codeSpans('Compara con == dentro de un if.')).toEqual(['==', 'if'])
  })

  it('marca cadenas y operadores dentro de una expresión', () => {
    expect(codeSpans('Pregunta con "cocina" in agenda.')).toEqual(['"cocina" in agenda'])
    expect(codeSpans('Usa print(sorted(peligrosos)).')).toEqual(['print(sorted(peligrosos))'])
  })

  it('conserva el texto completo al reconstruirlo', () => {
    const text = 'Usa print("SOS") y deja «Hora 6: Riego».'
    expect(splitStatement(text).map((part) => part.text).join('')).toBe(text)
  })
})
