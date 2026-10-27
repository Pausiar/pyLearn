# Plan de diseño

Producido con la skill `hallmark` (v2.0.0) antes de escribir la interfaz. Alcance: **app screen**
(la herramienta donde alguien juega y escribe código), no una landing.

## Preflight

- Referencia visual y de comportamiento: `reference/pylearn-demo.html`.
- Sistema previo del proyecto: ninguno. Tokens, tipografía y componentes se crean aquí.
- Restricciones del encargo que mandan sobre la skill: paleta y pila tipográfica fijadas, sitio
  estático sin fuentes externas, español con tuteo, pixel art solo dentro de los minijuegos.

## Material

- **Real**: el plan de 40 niveles, los nombres de los mundos, la paleta y la demo.
- **Dibujado por nosotros**: el pixel art (sprites en cuadrícula de texto), el mapa de hexágonos.
- **Ausente, y así se queda**: fotos, testimonios, cifras de usuarios, logotipos, capturas de un
  producto que aún no existe.

## La idea

**El color lo gana el alumno.** La interfaz es grafito sobre papel: sin degradados, sin
ilustraciones decorativas, un solo acento. El color saturado aparece únicamente donde hay
progreso o juego: el hexágono actual, el verde de lo completado, y el pixel art dentro del lienzo.
Todo lo demás compite en silencio con el código.

- **Job**: entrar al siguiente nivel y ver el programa funcionar.
- **Firma**: el camino de hexágonos con volumen —canto, cara y placa—, el tramo curvo que se
  enciende en verde al avanzar, la pastilla «Empieza» sobre el nivel actual y la tarjeta azul del
  mundo. Dentro del nivel, la firma es el campo de píxeles que responde línea a línea a lo que
  escribes.
- **Material del tema**: geometría y pixel art, nunca fotografía.

## Hallmark Picks

```markdown
**Hallmark · v2.0.0 · app screen**

- Screen · mapa de hexágonos y panel de nivel (misión, campo, editor) · estados: reposo, ejecutando, logrado, error
- Chrome · barra superior: marca a la izquierda, vidas y estrellas a la derecha, ajustes en un diálogo
- Firma · el camino de hexágonos; el campo de píxeles responde al código
- Material · real: el plan de niveles y la paleta del encargo · dibujado: sprites propios · ausente: fotos, cifras, testimonios
- Sweep · sloplint --scope app, 0 FAIL
```

## Tokens

| Token | Claro | Oscuro |
| --- | --- | --- |
| `--color-bg` | `#f5f5f7` | `#000000` |
| `--color-surface` | `#ffffff` | `#1c1c1e` |
| `--color-ink` | `#1d1d1f` | `#f5f5f7` |
| `--color-muted` | `#6e6e73` | `#a1a1a6` |
| `--color-accent` (texto y foco) | `#0071e3` | `#0a84ff` |
| `--color-accent-fill` (relleno) | `#0071e3` | `#0071e3` |
| `--color-done` | `#248a3d` | `#248a3d` |
| `--color-done-ink` (estrellas) | `#1a7f37` | `#30d158` |
| `--color-locked` | `#d2d2d7` | `#3a3a3c` |
| `--color-done-deep` (canto) | `#1b6b2e` | `#18622a` |
| `--color-accent-deep` (canto) | `#0058b8` | `#004f9e` |
| `--color-locked-deep` (canto y borde del camino) | `#b4b4bb` | `#2a2a2c` |
| `--color-node-shine` (placa del nodo) | `rgba(255,255,255,.12)` | `rgba(255,255,255,.08)` |
| `--color-danger` | `#d70015` | `#ff6961` |

Derivados respecto a la demo, por contraste: `--color-done` no llega a 4.5:1 como texto sobre
`#f5f5f7`, así que el verde de texto (estrellas) usa `--color-done-ink`. En oscuro, el relleno del
botón primario se queda en `#0071e3` con texto blanco (4.7:1); `#0a84ff` se reserva para texto y
foco sobre negro (5.7:1).

## Tipografía

Pila del sistema para todo, por mandato del encargo: `-apple-system, "SF Pro Text", "Segoe UI",
system-ui`. Monoespaciada solo para código y consola. Escala fija, razón 1.2, sin cabeceras
fluidas: 13, 14, 16, 19, 23, 28, 34 px. Peso máximo 600. Sin cursivas.

## Layout

- Una columna de 375 a 960 px, tope de 52 rem.
- Mapa: 360 unidades de ancho, centrado, tope de 26 rem.
- Nivel: una columna hasta 60 rem; a partir de ahí, campo y editor en dos columnas.
- Barra superior de 52 px, pegajosa, con las cifras en números tabulares.
- Espaciado en escala de 2, 4, 8, 12, 16, 20, 24, 32, 40, 48. Ningún valor suelto.

## Lo que este sistema no hace

- Sin degradados ni halos. La elevación del mapa son tres capas planas (canto, cara y placa), no una
  sombra difusa; el resto de la interfaz sigue siendo borde y cambio de superficie.
- Sin etiquetas en mayúsculas ni con tracking: la pastilla del nivel actual dice «Empieza» en la
  misma tipografía del sistema. La tarjeta del mundo lleva una línea pequeña sobre el título, como
  el capítulo de la referencia.
- Sin animación decorativa: solo el pulso del nivel actual y el movimiento del dron, ambos con
  alternativa con `prefers-reduced-motion`.
- Sin iconos que no sean SVG propios, y todo control con etiqueta accesible.

## Crítica pre-emit (Hallmark, 1 a 5)

**P4 H4 E5 S4 R5 V3** · la más débil es **V**: es la primera compilación del sistema, así que la
variedad aún no tiene contra qué contrastar. Se compensa con una decisión estructural propia (dos
columnas solo en el nivel, mapa a 26 rem) y queda pendiente al crecer el proyecto.

## Auditoría Apple Design

Se ejecuta al cerrar cada fase con interfaz. Resultados en `docs/AUDITORIA.md`.
