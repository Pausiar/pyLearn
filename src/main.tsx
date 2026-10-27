import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { browserStorage } from './app/storage'
import { applyTheme, readTheme } from './app/theme'
import './styles/tokens.css'
import './styles/app.css'

// Antes de montar, para que el tema guardado no parpadee al cargar.
applyTheme(readTheme(browserStorage()), document.documentElement)

const root = document.getElementById('root')

if (!root) {
  throw new Error('Falta el elemento #root en index.html')
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
