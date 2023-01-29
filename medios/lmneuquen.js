import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

// lmneuquenScrap()
async function lmneuquenScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.lmneuquen.com'
  const pagina = await fetch(url)
  const contenido = await pagina.text()
  const $ = cheerio.load(contenido)
  let noticias = []
  let total = 0
  let noticiasCompletas = []
  // Lmneuquen Noticias Principales
  $('.article-highlighted-md').each((index,el)=>{
    total++
    const rawLink = $(el).find('a').attr('href')
    const datosNoticia = {
      indice: total,
      link:rawLink,
    }
    noticias.push(datosNoticia)
  })

  //Lmneuquen Noticias secundarias
  $('.article-list-xl').each((index,el)=>{
    total++
    if(total >= cantidadMaxDeNoticias){return}
    const rawLink =  $(el).find('a').attr('href')
    const datosNoticia = {
      indice: total,
      link:rawLink,
    }
    noticias.push(datosNoticia)
  })
  // writeFile('json/lmneuquenList.json', JSON.stringify(noticias,null,2), (err) => {if (err) throw err})

  for (let noticia of noticias){
    const url = noticia.link
    const pagina = await fetch(url)
    const contenido = await pagina.text()
    const $ = cheerio.load(contenido)
    $('script').remove()
    $('noscript').remove()
    $('iframe').remove()
    $('footer').remove()
    $('.weather-widget').remove()
    $('.widgetContent').remove()
    $('.banner-wrapper').remove()
    $('.it-may-interest-you-sm').remove()
    $('.it-may-interest-you-xl').remove()
    $('.col-12.col-lg-4').remove()
    $('.note-themes').remove()
    $('.read-more').remove()
    $('.comments').remove()
    $('.no-gutters').remove()
    $('.article-theme').remove()
    $('.embed_copyright').remove()
    $('.embed_epigrafe').remove()
    $('.modal').remove()
    $('#fb-root').remove()
    $('.section-horizontal-sm').remove()
    $('.col.col-lg-auto').remove()
    $('embed_cont.type_imagen').remove()
    $('main').each((index,el)=>{
      // web += $(el).html()
      const rawTitular = $(el).find('.title').text()
      const rawlink = url
      const rawImagen = $(el).find('figure > img').attr('src')
      const rawResumen = $(el).find('h2').text()
      const rawArticulo = $(el).find('P').text()
      const rawFecha = $(el).find('.grouper.date').attr('datetime')

      const datosNoticia = {
        indice: noticia.indice,
        medio: 'Lmneuquen',
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
  writeFile('json/lmneuquen.json', JSON.stringify(noticiasCompletas,null,2), (err) => {if (err) throw err})
}
export {lmneuquenScrap}