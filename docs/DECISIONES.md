# Decisiones y supuestos

Fase 0. Todo lo que el encargo dejaba abierto se decidió así.

## Supuestos

1. **URL**: el repositorio se llama `pyLearn`, así que el sitio vive en
   `https://<usuario>.github.io/pyLearn/`. `vite.config.ts` usa `VITE_BASE` y cae en `/pyLearn/` al
   compilar; en desarrollo sirve la raíz. Si el repositorio cambia de nombre, basta con definir
   `VITE_BASE` en el workflow, sin tocar código.
2. **Un solo nivel jugable**: la Fase 0 entrega el nivel 1 completo (dron y cuatro cultivos). Los
   demás abren una ficha con lo que enseñarán. El resto de niveles llega en las fases 4 a 11.
3. **Estrellas por líneas**: 3 estrellas con 8 líneas o menos, 2 hasta 10, 1 por terminar. Es la
   métrica de la demo y del nivel 1; cada nivel definirá la suya.
4. **Sin cuentas**: el progreso vive en `localStorage` y se puede exportar e importar como JSON.

## Intérprete

Fase 1. Cuatro piezas con una responsabilidad cada una, en `src/interp/`:

- `lexer.ts`: tokens con **INDENT y DEDENT** como CPython, para que el parser reciba bloques ya
  delimitados. Los comentarios se ignoran solo fuera de las cadenas; la sangría con tabuladores es
  un error con su línea.
- `parser.ts`: descenso recursivo con la **precedencia real de Python** (`2 + 3 * 2` da 8; las
  potencias agrupan por la derecha) y comparaciones encadenadas (`1 < x < 10`).
- `evaluator.ts`: recorre el AST con ámbitos encadenados, `if/elif/else`, `while`, `for`, `break`,
  `continue`, `def` con parámetros y `return`, recursión, y `print()` que acumula salida.
- `run.ts`: la única función que ven los niveles, `run(code, api)`. Devuelve `{ lines, output,
  error? }` y el error lleva `line` y un mensaje en español.

Lenguaje cubierto: enteros y decimales, textos, booleanos y `None`; `+ - * / // % **`;
comparaciones, `and`, `or` y `not`; `range`, `len`, `int`, `float`, `str`, `bool`, `abs`, `round`,
`min` y `max`. **No** incluye listas, diccionarios, f-strings ni clases: llegan con sus mundos.

Límites: 20 000 sentencias y 200 llamadas anidadas, para que un bucle infinito o una recursión sin
fondo terminen con un mensaje y no cuelguen la pestaña. La traza que anima el nivel es la lista de
acciones que registra su propia API (`engine/drone.ts`), no una copia del estado.

Seguridad: no hay `eval` ni `new Function`; el código del alumno solo se interpreta. Los errores de
la API se convierten en errores de su línea y lo impreso antes de fallar se conserva.

El prototipo de la Fase 0 (`prototype.ts`) se ha eliminado: su comportamiento, incluida la falta de
precedencia, queda cubierto por las pruebas del intérprete nuevo.

## Progreso

- Clave `pylearn:v1`, esquema `{ version: 1, stars, lives }`, validado al leer: estrellas acotadas a
  0..3, niveles fuera de 1..40 descartados, vidas acotadas a 0..3.
- **Migración**: si no existe `pylearn:v1`, se lee la clave de la demo (`pylearn` con `{ st, lives }`)
  y se convierte. Probado con tests.
- Todo acceso a `localStorage` va en `try/catch` y funciona con almacenamiento bloqueado (se juega,
  no se guarda).
- Exportar descarga `pylearn-progreso.json`; importar valida con el mismo `parseProgress` y avisa si
  el archivo no es un progreso.

## Interfaz

- **Router por hash** (`#/`, `#/nivel/1`), obligatorio en GitHub Pages: ninguna ruta profunda puede
  dar 404 al recargar.
- **Tema** sistema, claro u oscuro, con `data-theme` en `<html>` y preferencia guardada. Se aplica
  antes de montar React para que no parpadee.
- **Tokens derivados** del encargo, por contraste: `--color-accent-text` (#0066cc en claro) para
  texto acentuado, `--color-done-ink` para el verde de texto, `--color-border-strong` para bordes de
  campo y `--color-accent` baja a #0071e3 en oscuro para que la tinta blanca llegue a 4.5:1.
- **Sin fuentes externas**: se usa la pila del sistema que fija el encargo. Hallmark pide una fuente
  de display; el requisito del usuario gana y queda anotado en su sello.
- **Sin JavaScript no hay app**: el intérprete corre en el navegador, así que un SPA no puede pintar
  contenido sin scripts. Se añade un `<noscript>` que lo explica. Es una desviación consciente del
  suelo de Hallmark.
- **Diálogos**: `.sheet:not([open])` devuelve el `display: none` a un `<dialog>` cerrado. Sin esa
  regla, el `display: flex` del panel ganaba al estilo del navegador y los ajustes aparecían al
  final de la página, debajo del mapa.
- **Anti-copia del enunciado**: copiar el texto del enunciado deja en el portapapeles una frase de
  broma (`DECOY_TEXT`) en lugar del texto. Es una decisión de producto del encargo; no impide leer,
  seleccionar ni usar lectores de pantalla.
- **Aviso al pegar**: pegar tres o más líneas con contenido, o 120 caracteres en una sola línea,
  muestra un aviso en la consola; el pegado se hace igual. La heurística vive en
  `app/clipboard.ts` y tiene pruebas.
- **Mapa**: zigzag de 95 unidades con paso 78 dentro de un mundo y 136 al empezar otro (para el
  rótulo y la pastilla EMPIEZA). Nodos de 27 unidades de radio, jefes de 36 con anillo y un canto de
  6 que da el volumen. Los tramos se curvan con Catmull-Rom (`curveSegments`) y se colorean por el
  nodo de salida, así que el camino se enciende en verde al avanzar.

## Alcance de la Fase 0

Incluye: proyecto Vite con TypeScript, ESLint y Vitest; workflow de Pages; mapa de 40 hexágonos;
nivel 1 jugable con campo animado, editor, consola, vidas y estrellas; progreso con exportación e
importación; tema claro y oscuro; documentación.

No incluye (fases siguientes): intérprete real, motor de escenas abstracto, los 39 niveles
restantes, sonido, modo libre, Pyodide.

## Verificación

- `npm run lint`, `npm test` (99 pruebas), `npm run build` y `npx tsc --noEmit` pasan.
- Hallmark `sloplint --scope app` sobre `src`: **0 FAIL, 0 WARN**, 10 avisos de `7b` cubiertos por
  la excepción declarada (la paleta la fija el encargo). En la Fase 1 destapó 6 SVG sin
  `aria-hidden` legible para su análisis estático (lo llevaban por spread); ahora está literal en
  cada icono.
- **Pendiente**: capa de render de sloplint, capturas y Lighthouse. En esta máquina no hay Chrome.
  El despliegue real tampoco se ha ejecutado: el workflow corre en el primer push a `main` y hace
  falta activar Pages con origen «GitHub Actions».
