# PyLearn

Aprende Python desde cero jugando. Cuarenta niveles en un camino de hexágonos, cada uno un
minijuego en pixel art donde se escribe código Python de verdad.

Sitio estático: sin backend, sin cuentas, sin llamadas de red en ejecución.

## Estado

| Fase | Contenido | Estado |
| --- | --- | --- |
| 0 | Base, despliegue y nivel 1 jugable | Hecha |
| 1 | Intérprete real (lexer, parser, AST, traza) | Hecha |
| 2 | Mapa completo e interfaz de progreso | Hecha |
| 3 | Motor de minijuegos y test de soluciones | Hecha |
| 4 a 11 | Un mundo por fase | Mundos 1 a 8 hechos |
| 12 | Pulido, accesibilidad y rendimiento | Pendiente |

Jugables ahora: los cuarenta niveles de los mundos 1 a 8. La demo visual de referencia vive en
`reference/pylearn-demo.html`.

## Comandos

```bash
npm ci          # instalar dependencias
npm run dev     # desarrollo en http://localhost:3000
npm run lint    # ESLint
npm test        # Vitest
npm run build   # tipos + build de producción en dist/
npm run preview # servir dist/
```

## Estructura

```
src/
  app/      shell, rutas por hash, tema, progreso, ajustes
  map/      mapa de hexágonos y ficha de nivel
  editor/   editor de código y consola
  interp/   intérprete de Python: lexer, parser, evaluador y funciones integradas
  engine/   lógica headless de los minijuegos
  levels/   catálogo, registro de niveles jugables y escenas
  pixel/    paleta, sprites y dibujo del lienzo
  styles/   tokens y estilos
docs/       decisiones de diseño y auditorías
reference/  demo original como referencia
```

## Despliegue

`.github/workflows/deploy.yml` compila, pasa lint y tests, y publica en GitHub Pages. Si los tests
fallan, no hay despliegue.

Pasos, una sola vez: en el repositorio, **Settings → Pages → Source: GitHub Actions**. El workflow
se dispara con cada push a `main` o a mano.

La base del sitio es `/pyLearn/`. Para otro nombre de repositorio o un dominio propio, define
`VITE_BASE` en el workflow.

## Accesibilidad

Contraste AA en claro y oscuro (valores en `docs/AUDITORIA.md`), controles de 44 px, foco visible,
recorrido completo con teclado, `aria-live` en la consola, descripción textual del lienzo y
alternativas para movimiento reducido, más contraste y menos transparencia.

## Documentación

- [`docs/DISENO.md`](docs/DISENO.md): plan de diseño y decisiones visuales.
- [`docs/DECISIONES.md`](docs/DECISIONES.md): supuestos, intérprete, progreso y alcance.
- [`docs/AUDITORIA.md`](docs/AUDITORIA.md): auditoría de Apple Design.
