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

- Es un **prototipo** (`src/interp/prototype.ts`), no el intérprete final: cubre llamadas,
  asignación, texto, `for` con `range` y aritmética. La Fase 1 lo sustituye por lexer con
  INDENT/DEDENT, parser a AST y evaluador con traza, manteniendo la misma interfaz pública.
- **Limitación conocida y probada**: evalúa de izquierda a derecha, sin precedencia (`2 + 3 * 2` da
  10). El nivel 1 no la necesita y hay un test que la documenta para que no se olvide.
- **Seguridad**: no hay `eval` ni `new Function`; el código del alumno solo se interpreta. Hay tope
  de 20 000 sentencias y los errores de la API se convierten en errores de línea.
- Los errores se devuelven como datos (`{ line, message }`), no como excepciones que lleguen a la
  interfaz.

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
- **Mapa**: la geometría es la de la demo (radio 26, jefes 36 con anillo, zigzag de 95 unidades,
  paso 78 y 112 por mundo).

## Alcance de la Fase 0

Incluye: proyecto Vite con TypeScript, ESLint y Vitest; workflow de Pages; mapa de 40 hexágonos;
nivel 1 jugable con campo animado, editor, consola, vidas y estrellas; progreso con exportación e
importación; tema claro y oscuro; documentación.

No incluye (fases siguientes): intérprete real, motor de escenas abstracto, los 39 niveles
restantes, sonido, modo libre, Pyodide.

## Verificación

- `npm run lint`, `npm test` (39 pruebas), `npm run build` y `npx tsc --noEmit` pasan.
- Hallmark `sloplint --scope app`: **0 FAIL, 0 WARN**, 10 avisos de `7b` cubiertos por la excepción
  declarada (la paleta la fija el encargo).
- **Pendiente**: capa de render de sloplint, capturas y Lighthouse. En esta máquina no hay Chrome.
  El despliegue real tampoco se ha ejecutado: el workflow corre en el primer push a `main` y hace
  falta activar Pages con origen «GitHub Actions».
