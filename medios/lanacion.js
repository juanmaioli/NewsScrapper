import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

async function lanacionScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.lanacion.com.ar'
  let noticias = []
  let noticiasCompletas = []
  const pagina = await fetch(url)
  const content = await pagina.text()
  const $ = cheerio.load(content)

  $('meta').remove()
  $('script').remove()
  $('noscript').remove()
  $('style').remove()
  $('ul').remove()
  $('svg').remove()
  $('img').remove()
  $('picture').remove()
  $('figure').remove()
  $('.mod-banner').remove()
  $('.mod-media').remove()
  $('strong').each((index,el)=>{
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

  for (let noticia of noticias){
    const url = noticia.link
    const pagina = await fetch(url)
    const contenido = await pagina.text()
    const $ = cheerio.load(contenido,{ decodeEntities: false })
    $('meta').remove()
    $('script').remove()
    $('noscript').remove()
    $('style').remove()
    $('svg').remove()
    $('nav').remove()
    $('link').remove()
    $('ul').remove()
    $('ol').remove()
    $('button').remove()
    $('.mod-banner').remove()
    $('[id^="fusion-static"]').remove()
    // $('[role^="button"]').remove()
    $('[data-fusion-lazy-id]').remove()
    $('blockquote').remove()
    $('.mod-headersection').remove()
    $('.mod-trust').remove()
    $('.mod-share-container').remove()
    $('.mod-autor').remove()
    $('.mod-themes').remove()
    $('.com-embed').remove()
    $('.sidebar__aside').remove()
    $('#audio-player-desktop').remove()
    $('.com-hour').remove()
    $('main').each((index,el)=>{
      const rawTitular = $(el).find('.com-title').text()
      const rawlink = url
      const rawFecha = $(el).find('.com-date').text()
      const rawImagen =  $(el).find('img').attr('src')
      const rawResumen = $(el).find('.com-subhead').text()
      const rawArticulo = $(el).find('p').text()

      const datosNoticia = {
        indice: noticia.indice,
        medio: 'La Nacion',
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
  writeFile('json/lanacion.json', JSON.stringify(noticiasCompletas,null,2), (err) => {if (err) throw err})
}

export {lanacionScrap}