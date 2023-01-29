import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function cronistaScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.cronista.com'
  let noticias = []
  let noticiasCompletas = []
  const browser = await puppeteer.launch({headless: true,args: ['--no-sandbox', '--disable-setuid-sandbox']})
  const page = await browser.newPage()
  await page.goto(url)
  const content = await page.content()
  const $ = cheerio.load(content)

  $('meta').remove()
  $('script').remove()
  $('noscript').remove()
  $('style').remove()
  $('ul').remove()
  $('svg').remove()
  $('img').remove()
  $('picture').remove()
  $('.adbanner').remove()
  $('aside').remove()
  $('.image').remove()
  $('.media').remove()
  $('.index').remove()
  $('.kicker').remove()
  $('.authortitle').remove()
  $('.author').remove()
  $('.separator').remove()
  $('.scroll-button').remove()
  $('article').each((index,el)=>{

    if(index >= cantidadMaxDeNoticias){return}
    const rawlink = url +  $(el).find('h2 > a').attr('href')
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
    const dec = new TextDecoder('windows-1252') //Here I can inform the desired charset
    const arrBuffer = await pagina.arrayBuffer()
    const ui8array = new Uint8Array(arrBuffer)
    const contenido = dec.decode(ui8array)
    // const contenido = await pagina.text()
    const $ = cheerio.load(contenido,{ decodeEntities: false })
    $('meta').remove()
    $('script').remove()
    $('noscript').remove()
    $('style').remove()
    $('ul').remove()
    $('svg').remove()
    $('aside').remove()
    $('source').remove()
    $('.breadcrumb').remove()
    $('.kicker').remove()
    $('.authortitle').remove()
    $('.author').remove()
    $('.separator').remove()
    $('.scroll-button').remove()
    $('ul').remove()
    $('.zone').remove()
    $('.author-date-play').remove()
    $('.article-toolbar').remove()
    $('.moreinfo').remove()
    $('.zoom').remove()
    $('.busy').remove()
    $('.comments-zone').remove()
    $('.tag-section').remove()
    $('.gallery_popup').remove()
    $('.index-wrapper').remove()
    $('.with-section-title').remove()
    $('#apartado-metodologico').remove()
    // $('#pagecontent').remove()
    $('#pagecontent').each((index,el)=>{
      const rawTitular = $(el).find('.title').text()
      const rawlink = url
      const rawFecha = new Date()
      const rawImagen = 'https://www.cronista.com' + $(el).find('img').attr('vsmsrc')
      const rawResumen = $(el).find('.description').text()
      const rawArticulo = $(el).find('p').text()

      const datosNoticia = {
        indice: noticia.indice,
        medio: 'El Cronista',
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
  writeFile('json/cronista.json', JSON.stringify(noticiasCompletas,null,2), (err) => {if (err) throw err})
  setTimeout(() => {
    browser.close()
  }, 5000)
}
export {cronistaScrap}