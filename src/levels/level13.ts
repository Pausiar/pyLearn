import { createVault, createVaultApi, judgeVault, vaultSteps } from '../engine/vault'
import { VaultScene } from './scenes/VaultScene'
import type { PlayableLevel } from './types'

export const PLAYABLE_13: PlayableLevel = {
  id: 13,
  title: 'Hackeo simulado',
  concept: 'for, if y break',
  story:
    'La caja fuerte tiene 6 contraseñas posibles, de la 1 a la 6, y solo una abre. Pruébalas en orden con probar(numero), que devuelve True cuando acierta, y recórrelas con un for y range(1, 7). En cuanto una abra la caja, anúncialo con print() —exactamente «Abierta con la contraseña 4»— y deja de probar con break: cada intento de más se cuenta.',
  hint:
    'Dentro del for, if probar(numero): abre el bloque y ahí van, con sangría, el print() y el break. Consigue 3 estrellas con 5 líneas o menos.',
  starter: [
    '# Seis contraseñas posibles, de la 1 a la 6.',
    '# Hay que parar en cuanto una abra la caja.',
  ].join('\n'),
  solution: [
    'for numero in range(1, 7):',
    '    if probar(numero):',
    '        print("Abierta con la contraseña " + str(numero))',
    '        break',
  ].join('\n'),
  par: 5,
  sceneTitle: 'La caja fuerte',
  success: 'La caja se ha abierto sin gastar intentos de más.',
  Scene: VaultScene,
  start() {
    const vault = createVault()

    return {
      api: createVaultApi(vault),
      finish(result) {
        return { ...judgeVault(vault, result.output), steps: vaultSteps(vault) }
      },
    }
  },
}
