/** Lo mínimo de Storage que usa la app, para poder inyectar uno falso en los tests. */
export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Devuelve localStorage, o null si el navegador lo bloquea (modo privado, cookies, etc.). */
export function browserStorage(): StorageLike | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
