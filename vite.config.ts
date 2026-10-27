import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages sirve el sitio bajo /pyLearn/. En desarrollo se usa la raíz,
// y el despliegue puede cambiarlo con VITE_BASE (por ejemplo, un dominio propio).
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : (process.env.VITE_BASE ?? '/pyLearn/'),
  plugins: [react()],
  build: {
    target: 'es2022',
    cssTarget: 'safari15',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
