# Auditoría de Apple Design

Cierre de la Fase 0. Base: `apple-design` (SKILL.md › Review process, lente 1) y las páginas
`hig/accessibility.md`, `hig/color.md`, `hig/dark-mode.md`, `hig/typography.md`, `hig/writing.md`.

## Contexto

- **Plataforma**: web (GitHub Pages). Se aplican los principios y las bases de Apple, no las
  convenciones de iOS o macOS, que no existen en este soporte.
- **Framework**: React 19 sobre Vite, CSS propio.
- **Público**: adolescentes sin experiencia previa, en móvil y escritorio.
- **Artefacto**: código y app en ejecución. Sin navegador en la máquina de trabajo: el contraste se
  calcula sobre los valores hexadecimales, no se estima de una captura.

## Lente 1: accesibilidad

Todos los pares se calcularon con la fórmula WCAG. Umbrales de `hig/accessibility.md › Contrast`:
4.5:1 hasta 17 pt, 3:1 desde 18 pt y 3:1 para negrita.

| Par | Claro | Oscuro | Umbral |
| --- | --- | --- | --- |
| Texto sobre fondo | 15.5:1 | 19.3:1 | 4.5 |
| Texto secundario sobre fondo | 4.7:1 | 6.6:1 | 4.5 |
| Acento de texto sobre fondo | 5.1:1 | 5.8:1 | 4.5 |
| Tinta sobre relleno de acento | 4.7:1 | 4.7:1 | 4.5 |
| Verde de estrellas sobre fondo | 4.7:1 | 10.4:1 | 4.5 |
| Error sobre tarjeta | 5.4:1 | 6.0:1 | 4.5 |
| Borde de campo sobre superficie | 3.4:1 | 3.4:1 | 3:1 |
| Anillo de foco sobre fondo | 5.1:1 | 5.8:1 | 3:1 |
| Número de nivel sobre su hexágono | 4.4:1 a 3.4:1 | 4.4:1 a 4.4:1 | 3:1 (negrita) |

- **Controles**: botones y enlaces de acción a 44 x 44 px; el mapa dibuja hexágonos de 52 px o más.
  Por encima del mínimo de Apple (`accessibility.md`: 44 pt recomendado, 28 pt mínimo).
- **Foco**: anillo de 3 px, instantáneo, con contraste propio sobre las cuatro superficies del mapa.
- **Teclado**: todo el recorrido es nativo (enlaces, botones, textarea). Los nodos del mapa son
  `role="button"` con `tabindex` y responden a Intro y Espacio. Escape sale del editor y cierra los
  diálogos.
- **Color no único portador**: el nivel actual lleva la etiqueta «Aquí» y `aria-current="step"`,
  además del relleno de acento. Los completados llevan estrellas y nombre accesible con el número.
- **Movimiento**: el pulso del nodo actual vive dentro de `prefers-reduced-motion: no-preference`;
  el dron no oscila y las transiciones se desactivan con `reduce`. La barra pierde el desenfoque con
  `prefers-reduced-transparency`; el contraste sube con `prefers-contrast: more`.
- **Texto**: cuerpo a 16 px, mínimo 14 px (10.5 pt), por encima del mínimo de escritorio de Apple
  (10 pt) y por debajo de los 11 pt de iOS, que es un objetivo de app nativa.

## Niveles 2 a 5

- Cada lienzo conserva `role="img"` y un `aria-label` con el estado (mensajes enviados, contenido
  de la mochila, texto del letrero, posición del dron), más el pie visible.
- El juicio no depende de distinguir colores: la consola dice qué falta con palabras.
- Los cuatro lienzos respetan `prefers-reduced-motion`: con movimiento reducido, los pasos aparecen
  sin espera.
- Los controles siguen siendo los mismos de la Fase 0; la escena es solo lectura.

## Lente 2: convenciones

- Barra superior con marca, cifras del jugador y un solo acceso a ajustes. Ajustes en una hoja, no
  en una pantalla aparte: es lo que Apple recomienda para preferencias breves.
- Estado en la URL (hash), de modo que recargar o compartir un nivel no rompe nada.
- Acción destructiva con confirmación en dos pasos; ninguna acción irreversible a un clic.
- Diálogos con `<dialog>` nativo: foco atrapado, Escape y retorno del foco los pone el navegador.

## Lente 3: jerarquía y claridad

Una idea por pantalla: el mapa es el camino, el nivel es la misión. El color saturado se reserva
para el progreso y el juego; el resto es grafito sobre papel. Los encabezados no compiten: h1 de
pantalla, h2 por panel.

## Lente 4: oficio

- Escala de espaciado única, sin valores sueltos.
- Una sola receta de botón primario; secundario con borde; peligro sin relleno.
- Números tabulares en vidas, estrellas y descripción del campo.
- Textos en tuteo, verbos en los botones, errores que dicen qué pasó y cómo arreglarlo.

## Hallazgos y estado

| # | Lente | Hallazgo | Severidad | Estado |
| --- | --- | --- | --- | --- |
| 1 | Accesibilidad | El nivel actual se distinguía solo por color | Alta | Corregido: etiqueta «Aquí» y `aria-current` |
| 2 | Accesibilidad | 13 px en notas y pies, por debajo del mínimo de escritorio de Apple | Media | Corregido: mínimo 14 px |
| 3 | Accesibilidad | Sin respuesta a más contraste ni a menos transparencia | Media | Corregido con `prefers-contrast` y `prefers-reduced-transparency` |
| 4 | Convenciones | Los diálogos dependían del evento sintético de React | Media | Corregido: escucha nativa de `close` |
| 5 | Redacción | Un error usaba «hemos recargado» con sujeto ambiguo | Baja | Corregido según `hig/writing.md` |
| 6 | Accesibilidad | Las etiquetas del SVG escalan con el mapa (16 unidades: 15 px a 375, 13 px a 320) | Baja | Abierto, aceptado: el `aria-label` lleva la información completa |

## Rediseño del mapa (camino con volumen)

Revisión al adoptar el camino de la referencia: nodos con canto, camino curvo y tarjeta de mundo.
Pares nuevos, calculados sobre los tokens:

| Par | Claro | Oscuro | Umbral |
| --- | --- | --- | --- |
| Texto de la tarjeta sobre el azul | 4.70:1 | 4.70:1 | 4.5 |
| Texto de «Empieza» sobre su pastilla | 15.46:1 | 19.29:1 | 4.5 |
| Número de nivel sobre el hexágono bloqueado | 11.74:1 | 8.12:1 | 4.5 |
| Check sobre la placa verde | 3.61:1 | 3.86:1 | 3:1 (gráfico) |
| Triángulo de juego sobre el azul | 3.89:1 | 4.16:1 | 3:1 (gráfico) |
| Tramo completado sobre el fondo | 4.04:1 | — | 3:1 (gráfico) |
| Rótulo de mundo sobre el fondo | 4.66:1 | 8.16:1 | 4.5 |

- El número de nivel pasa de `--color-muted` a `--color-ink`: sobre el gris bloqueado, el gris
  secundario no llegaba a 4.5:1.
- El nodo actual ya no lleva el texto «Aquí»: lo dicen la pastilla EMPIEZA, la tarjeta del mundo y
  `aria-current="step"`.
- Las estrellas por nivel salen del mapa: se solapaban con el nodo siguiente y la referencia no las
  usa. Siguen en el nombre accesible de cada nodo y en el contador de la barra.
- El camino bloqueado es decorativo y de bajo contraste (1.38:1 en claro): la información está en
  los nodos, cada uno con etiqueta y número. El tramo completado sí llega a 3:1.
- Tamaño táctil: hexágono de 54 px de ancho (27 de radio) más el canto; los jefes, 72. Por encima
  de los 44 pt de Apple.
- La pastilla del nivel actual dice «Empieza» en sentencia y sin tracking: Hallmark lo exige para
  etiquetas y la insignia no necesita mayúsculas.

## Límites de esta auditoría

- Sin navegador en la máquina: no hay capturas, ni comprobación de la capa de render de sloplint, ni
  Lighthouse. Queda pendiente al abrir la app en un navegador real.
- No se probó con lector de pantalla ni con zoom de texto al 200 %. Las estructuras están puestas
  para que funcionen (jerarquía de encabezados, `aria-live`, etiquetas), pero no se verificaron.
- El contraste se calculó sobre los tokens, no sobre colores computados con mezclas (`color-mix`).
