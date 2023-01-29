
import {infobaeScrap} from './medios/infobae.js'
import {lmneuquenScrap} from './medios/lmneuquen.js'
import {rionegroScrap} from './medios/rionegro.js'
// import {OleScrap} from './medios/ole.js'
import {perfilScrap} from './medios/perfil.js'
import {cronistaScrap} from './medios/cronista.js'
import {lanacionScrap} from './medios/lanacion.js'
console.time('test')
console.log('Importando Infobae')
await infobaeScrap(22)
console.log('Importando Lmneuquen')
await lmneuquenScrap(20)
console.log('Importando Rio Negro')
await rionegroScrap(20)
// console.log('Importando Olé')
// await OleScrap(20)
console.log('Importando El Cronista')
await cronistaScrap(20)
console.log('Importando Perfil')
await perfilScrap(20)
console.log('Importando La Nacion')
await lanacionScrap(20)
console.timeEnd('test')
// console.log('Esperando....')

// setInterval(() => {
//   console.time('test')
//   console.log(new Date,' corriendo script')
//   InfobaeScrap(22)
//   lmneuquenScrap(25)
//   console.timeEnd('test')
// }, 600000)