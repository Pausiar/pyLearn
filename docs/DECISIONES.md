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

## Niveles

Un nivel jugable es un objeto `PlayableLevel` (`src/levels/types.ts`): metadatos, enunciado, código
inicial, solución, par de estrellas y una escena. `start()` abre la partida con su API y `finish()`
decide el resultado y devuelve la traza que el lienzo reproduce.

- Mundo 1 completo: dron (1), faro (2), mochila (3), letrero (4) y repaso final (5).
- Mundo 2 completo: cohete (6, operadores), tienda (7, `input()` simulado con `int()` y `str()`),
  cerradura (8, booleanos y comparaciones), semáforo (9, `if`/`else`) y guardián (10, `elif`).
- Mundo 3 completo: riego en bucle (11, `for` y `range` con cien cultivos), minero (12, `while` y
  contadores), caja fuerte (13, `for` con `if` y `break`), escáner (14, `range` con paso, `continue`
  y `break`) y campo del jefe (15, bucles anidados).
- Escenas en `src/levels/scenes/`: un lienzo por tipo, todos con `role="img"`, `aria-label` con el
  estado y pie visible. Se dibujan con rectángulos, sin imágenes ni degradados. Las escenas con
  texto (faro, mochila y letrero) se dibujan a 2× y se muestran con `image-rendering: auto`, para
  que las letras no salgan pixeladas; el campo del dron sigue a 1× con píxeles duros.
- Estrellas por nivel: 3 hasta su `par` de líneas, 2 hasta dos más, 1 por terminarlo.
- El juicio es explícito y en español: cada nivel devuelve qué falta, no solo si está bien.
- El catálogo decía «f-strings» para el nivel 4; como el intérprete aún no las tiene, el nivel
  enseña concatenación con `+` y `str()`, y el catálogo se ha corregido.
- `registry.test.ts` recorre los quince niveles: la solución completa, el código inicial no, y la
  solución cabe en su par. Un nivel nuevo con una solución rota rompe los tests.
- **Un nivel puede juzgarse en varias situaciones**: `finish(result, code)` recibe el código para
  volver a ejecutarlo en otro escenario. El semáforo corre una vez con la luz roja (lo que ya se ve
  en pantalla) y otra con la verde; el guardián repite el programa con los tres pases. Así no pasa
  un `cruzar()` incondicional ni un guardián que abre siempre la misma puerta.
- Los `minijuegos` del mundo 2 viven en `src/engine/`: `input()` devuelve la respuesta del cliente
  en orden, `luz()` y `pase()` devuelven el estado de la escena y `candado()` solo acepta un
  booleano de verdad, no un número disfrazado.
- Las cinco escenas nuevas siguen el patrón de las del mundo 1: lienzo a 2× con texto nítido,
  `role="img"`, `aria-label` con el estado y pie visible.
- En el mundo 3 las funciones de la API devuelven valores (`hay_piedra()`, `probar()`, `revisar()`),
  no solo registran acciones. El escáner gasta una lectura en cada `revisar()` y `vacio()` es
  gratis: por eso `continue` no es decorativo. El juicio mira además lo que deja de pasar: al 14 le
  suspende que el pasillo 9 siga revisándose (faltó el `break`) y al 13 que se prueben las seis
  contraseñas cuando el acierto llegó en la cuarta.
- El campo del 11 riega cien cultivos, así que su traza guarda un fotograma cada diez cultivos: con
  los 200 pasos del programa la animación duraría minutos. El 15 hace lo mismo por casilla regada
  (doce fotogramas).
- El catálogo decía «lista ficticia» para el 13 y «en serpiente» para el 15. Como el intérprete
  todavía no tiene listas y el riego en serpiente exigiría condiciones que ese nivel no enseña, el
  catálogo se ha corregido a «Prueba las contraseñas de una caja fuerte» y «Riega las 12 casillas
  de una cuadrícula».

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

- `npm run lint`, `npm test` (213 pruebas), `npm run build` y `npx tsc --noEmit` pasan.
- Hallmark `sloplint --scope app` sobre `src`: **0 FAIL, 0 WARN**, 10 avisos de `7b` cubiertos por
  la excepción declarada (la paleta la fija el encargo). En la Fase 1 destapó 6 SVG sin
  `aria-hidden` legible para su análisis estático (lo llevaban por spread); ahora está literal en
  cada icono.
- **Pendiente**: capa de render de sloplint, capturas y Lighthouse. En esta máquina no hay Chrome.
  El despliegue real tampoco se ha ejecutado: el workflow corre en el primer push a `main` y hace
  falta activar Pages con origen «GitHub Actions».
