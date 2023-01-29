import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

// perfilScrap(20)
async function perfilScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.perfil.com/'
  const pagina = await fetch(url)
  const content = await pagina.text()
  const $ = cheerio.load(content)
  let noticias = []
  let noticiasCompletas = []
  let total = 0

  $('script').remove()
  $('meta').remove()
  $('link').remove()
  $('noscript').remove()
  $('nav').remove()
  $('style').remove()
  $('iframe').remove()
  $('ul').remove()
  $('.hamburguer').remove()
  $('.radio-perfil').remove()
  $('.hat').remove()
  $('figure').remove()
  $('.pre-header').remove()
  $('.buscador').remove()
  $('.main-header').remove()
  $('#central-header').remove()
  $('.headline').remove()
  $('h2').remove()
  $('.firma-home').remove()
  $('.galeria-video').remove()
  $('.mf').remove()
  $('.ads-space').remove()
  $('.bloomberg').remove()
  $('.cajageneral').remove()
  $('.caja-contenido.bloque').remove()
  $('.divisas__content').remove()
  $('.boxsidebar').remove()
  $('.ranking').remove()
  $('#columnistas').remove()
  $('source').remove()
  $('img').remove()
  $('.podcasts-radio').remove()
  $('footer').remove()
  $('picture').remove()
  $('#central-footer').remove()
  $('#masLeidasSidebar').remove()
  $('.sidebar').remove()
  $('.ventas-directas').remove()
  $('.vivo').remove()
  $('.canal--mujer').remove()
  $('.canal--espectaculos').remove()
  $('.cobertura--verano').remove()
  $('.d-xs-none').remove()
  $('.d-sm-none').remove()
  $('.d-md-none').remove()

  //Perfil Noticias

  $('article').each((index,el)=>{
    total++
    if(total >= cantidadMaxDeNoticias){return}
    const rawlink = $(el).find('article > div > a').attr('href')
    const datosNoticia = {
      indice: total,
      link:rawlink,
    }
    if(rawlink){
      if(rawlink.includes('undefined') == false){
        noticias.push(datosNoticia)
      }
    }
  })

  for(let noticia of noticias){
    const urlNoticia = noticia.link
    const pagina = await fetch(urlNoticia)
    const content = await pagina.text()
    const $ = cheerio.load(content)

    $('script').remove()
    $('meta').remove()
    $('link').remove()
    $('noscript').remove()
    $('nav').remove()
    $('style').remove()
    $('iframe').remove()
    $('aside').remove()
    $('ul').remove()
    $('.hamburguer').remove()
    $('.radio-perfil').remove()
    $('.hat').remove()
    $('source').remove()
    $('figcaption').remove()
    $('h4').remove()
    $('.d-xs-none').remove()
    $('.d-sm-none').remove()
    $('.d-md-none').remove()
    $('.d-lg-none').remove()
    $('.mas-en-perfil').remove()
    $('.noticias-relacionadas').remove()
    $('.viafoura').remove()
    $('.comments').remove()

    $('.supercontenedor').each((index,el)=>{
      const rawFecha = $('.fecha').text().replace(/(\r\n|\n|\r|\t)/gm,'')
      const rawTitular = $(el).find('h1').text()
      const rawlink = url
      const rawImagen = $(el).find('picture > img').attr('src')
      const rawResumen =  $(el).find('.headline').text().replace(/(\r\n|\n|\r|\t)/gm,'')
      let rawArticulo = $(el).find('p').text().replace(/(\r\n|\n|\r|\t")/gm,'')
      rawArticulo = rawArticulo.replace(/\u00A0/g, '')

      const datosNoticia = {
        indice: noticia.indice,
        medio: 'Perfil',
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

  writeFile('./json/perfil.json', JSON.stringify(noticiasCompletas,null,2), (err) => {if (err) throw err})
}
export {perfilScrap}