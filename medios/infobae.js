import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
// InfobaeScrap()
async function infobaeScrap(cantidadMaxDeNoticias=2){
  const url = 'https://infobae.com'
  const pagina = await fetch(url)
  const contenido = await pagina.text()
  const $ = cheerio.load(contenido)
  let noticias = []
  let noticiasCompletas = []
  let total = 0

  //Infobae Noticias pricipales OK
  $('.tcc_itm').each((index,el)=>{
    total++
    const rawlink = url +  $(el).find('a').attr('href')
    const datosNoticia = {
      indice: total,
      link:rawlink,
    }
    noticias.push(datosNoticia)
  })

  //Infobae Noticias secundarias
  $('.ndc_ctn').each((index,el)=>{
    total++
    if(index >= cantidadMaxDeNoticias){return}
    const rawlink = url +  $(el).find('a').attr('href')
    const datosNoticia = {
      indice: index,
      link:rawlink,
    }
    if(rawlink.includes('undefined') == false && rawlink.includes('comhttps') == false){
      noticias.push(datosNoticia)
    }
  })

  // writeFile('json/infobaeList.json', JSON.stringify(noticias,null,2), (err) => { if (err) throw err})

  for (let noticia of noticias){
    const url = noticia.link
    const pagina = await fetch(url)
    const contenido = await pagina.text()
    const $ = cheerio.load(contenido)
    const rawFecha = $('.mhh-date-item').text()
    $('.article-section').each((index,el)=>{
      const rawTitular = $(el).find('.article-headline').html()
      const rawlink = url
      const rawImagen = $(el).find('.visual__image > img').attr('src')
      const rawResumen = $(el).find('.article-subheadline').text()
      const rawArticulo = $(el).find('.paragraph').text()

      const datosNoticia = {
        indice: noticia.indice,
        medio: 'Infobae',
        fechaObtenido: Math.floor(Date.now() / 1000),
        fechaArticulo : rawFecha,
        link:rawlink,
        titular:rawTitular,
        resumen:rawResumen,
        articulo:rawArticulo,
        imagen:rawImagen,
      }

      noticiasCompletas.push(datosNoticia)
    })
  }
  writeFile('./json/infobae.json', JSON.stringify(noticiasCompletas,null,2), (err) => { if (err) throw err})
}

export {infobaeScrap}