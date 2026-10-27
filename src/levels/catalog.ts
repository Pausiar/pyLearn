export interface LevelSummary {
  id: number
  world: number
  boss: boolean
  title: string
  concept: string
  game: string
}

export interface WorldSummary {
  id: number
  title: string
  setting: string
}

export const WORLDS: readonly WorldSummary[] = [
  { id: 1, title: 'Despegue', setting: 'granja y señales' },
  { id: 2, title: 'Números y decisiones', setting: 'cohetes y castillos' },
  { id: 3, title: 'Bucles', setting: 'mina, campo y ciberseguridad' },
  { id: 4, title: 'Listas', setting: 'trenes y pizzerías' },
  { id: 5, title: 'Funciones', setting: 'cocina y robots' },
  { id: 6, title: 'Datos', setting: 'nave y museo' },
  { id: 7, title: 'Errores y módulos', setting: 'puentes y aventuras' },
  { id: 8, title: 'Objetos', setting: 'taller y bestiario' },
]

function level(id: number, title: string, concept: string, game: string): LevelSummary {
  return { id, world: Math.ceil(id / 5), boss: id % 5 === 0, title, concept, game }
}

export const LEVELS: readonly LevelSummary[] = [
  level(1, 'Primer vuelo', 'Instrucciones en secuencia', 'Dron granjero: riega 4 cultivos'),
  level(2, 'Mensaje en botella', 'print() y cadenas', 'Faro pixel que emite señales de texto'),
  level(3, 'La mochila', 'Variables y asignación', 'Inventario de un explorador'),
  level(4, 'Letreros de neón', 'Concatenación y str()', 'Carteles de una ciudad nocturna'),
  level(5, 'Jefe: el gran día de la granja', 'Repaso del mundo 1', 'Una jornada completa del dron'),
  level(6, 'Combustible', 'Números y operadores', 'Calcula el combustible de un cohete'),
  level(7, 'La tienda', 'input() simulado, int() y str()', 'Cajero de una tienda pixel'),
  level(8, 'La cerradura', 'Booleanos, comparaciones y lógica', 'Una puerta con tres candados'),
  level(9, 'El semáforo', 'if y else', 'Decide cuándo cruza un peatón'),
  level(10, 'Jefe: el guardián', 'elif y condiciones anidadas', 'Valida pases en un castillo'),
  level(11, 'Riego en bucle', 'for y range', 'El dron riega 100 cultivos'),
  level(12, 'El minero', 'while y contadores', 'Un robot excava hasta agotar la veta'),
  level(13, 'Hackeo simulado', 'for, if y break', 'Prueba las contraseñas de una caja fuerte'),
  level(14, 'El escáner', 'break, continue y range con paso', 'Revisa pasillos y salta los vacíos'),
  level(15, 'Jefe: el campo entero', 'Bucles anidados', 'Riega las 12 casillas de una cuadrícula'),
  level(16, 'El tren', 'Listas, índices y len', 'Engancha vagones por su posición'),
  level(17, 'El repartidor', 'for sobre listas', 'Entrega un paquete en cada casa'),
  level(18, 'La pizzería', 'append, remove, insert, pop y sort', 'Gestiona la cola de pedidos'),
  level(19, 'Rebanadas', 'Slicing y el operador in', 'Corta el tren para formar el convoy'),
  level(20, 'Jefe: mochila de aventurero', 'Listas, bucles y condicionales', 'Ordena y filtra un inventario'),
  level(21, 'El truco nuevo', 'def y llamadas', 'Enseña saltar_valla() a un robot'),
  level(22, 'Pizzas a medida', 'Parámetros y valores por defecto', 'Prepara pedidos distintos'),
  level(23, 'La expendedora', 'return', 'Devuelve el cambio exacto'),
  level(24, 'Laboratorios', 'Ámbito local y global', 'Aísla experimentos en salas'),
  level(25, 'Jefe: cocina modular', 'Funciones que llaman a funciones', 'Dirige un restaurante con recetas'),
  level(26, 'La agenda', 'Diccionarios, claves y get', 'Busca contactos de una nave'),
  level(27, 'El censo', 'items(), keys() y values()', 'Cuenta habitantes por planeta'),
  level(28, 'Cromos únicos', 'Tuplas y sets', 'Completa un álbum sin repetidos'),
  level(29, 'Cazamonstruos', 'Comprensiones de listas', 'Filtra monstruos peligrosos'),
  level(30, 'Jefe: el archivo', 'Estructuras anidadas', 'Consulta la base de datos de un museo'),
  level(31, 'El puente', 'try, except y sus errores', 'Una caravana cruza sin romper nada'),
  level(32, 'Dados', 'random y math', 'Lanza dados con semilla fija'),
  level(33, 'El diario', 'open, read, write y with', 'Archivos simulados en memoria'),
  level(34, 'Cazabichos', 'Depuración y lectura de errores', 'Tres bichos en el mismo código'),
  level(35, 'Jefe: aventura de texto', 'Funciones, listas, diccionarios y azar', 'Una aventura de terminal retro'),
  level(36, 'La mascota', 'class, instancias y atributos', 'Cría una mascota pixel'),
  level(37, 'El taller', '__init__, métodos y self', 'Construye robots con piezas propias'),
  level(38, 'Herencia', 'Herencia, super() y polimorfismo', 'Un árbol de familias de monstruos'),
  level(39, 'La carrera', 'Ordenar y buscar', 'Ordena coches y adivina el número'),
  level(40, 'Jefe final: tu juego', 'Proyecto libre', 'Un sandbox para crear tu minijuego'),
]

export const LEVEL_COUNT = LEVELS.length

export function levelById(id: number): LevelSummary | undefined {
  return LEVELS.find((entry) => entry.id === id)
}

export function worldById(id: number): WorldSummary | undefined {
  return WORLDS.find((entry) => entry.id === id)
}
