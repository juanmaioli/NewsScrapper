import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function rionegroScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.rionegro.com.ar/'
  const browser = await puppeteer.launch({headless: true,args: ['--no-sandbox', '--disable-setuid-sandbox']})
  const page = await browser.newPage()
  await page.goto(url)
  const content = await page.content()
  const $ = cheerio.load(content)
  // let webHtml = ''
  let noticiasCompletas = []
  let noticias = []
  let total = 0
  //Rio Negro Noticias
  $('.news__title').each((index,el)=>{
    if(total >= cantidadMaxDeNoticias){return}
    const rawLink = $(el).find('a').attr('href')
    if(rawLink.includes('/cartas/') == false && rawLink.includes('/en-casa/') == false  && rawLink.includes('/opinion/') == false && rawLink.includes('/energia/') == false && rawLink.includes('/digo/') == false && rawLink.includes('/horoscopo/') == false && rawLink.includes('/sociedad/') == false && rawLink.includes('/gastronomia/') == false){
      total++
      const datosNoticia = {
        indice: total,
        link:rawLink,
      }
      noticias.push(datosNoticia)
    }
  })

  // writeFile('json/rionegroList.json', JSON.stringify(noticias,null,2), (err) => {if (err) throw err})

  for ( let noticia of noticias){
    const url = noticia.link
    // const browser = await puppeteer.launch({headless: true,args: ['--no-sandbox', '--disable-setuid-sandbox']})
    // const page = await browser.newPage()
    // await page.goto(url)
    // const content = await page.content()
    const pagina = await fetch(url)
    const contenido = await pagina.text()

    const $ = cheerio.load(contenido)
    $('.col--aside').remove()
    $('.newsfull__tags').remove()
    $('.row.recomendations').remove()
    $('#comments__section').remove()
    $('#suscribite__section').remove()
    $('[id^="inline"]').remove()
    $('.wp-block-lazyblock-subtitulo-h2').remove()
    $('.wp-block-separator').remove()
    $('.newsfull__share').remove()
    $('figcaption').remove()
    // $('.newsfull__excerpt').remove()
    $('.newsfull__authors_media').remove()
    $('h2').remove()
    $('span').remove()

    $('.newsfull').each((index,el)=>{
      // webHtml += $(el).html()
      const rawTitular = $(el).find('.newsfull__title').text()
      const rawlink = url
      const rawImagen = $(el).find('.photogallery__image > img').attr('src')
      const rawFecha = $(el).find('.newsfull__time').text().slice(0,10)
      $('.newsfull__authors_data').remove()
      const rawResumen = $(el).find('.newsfull__excerpt >  .newsfull__excerpt').text().replace(/(\r\n|\n|\r|\t)/gm,'')
      const rawArticulo = $(el).find('P').text().replace(/(\r\n|\n|\r|\t)/gm,'')

      const datosNoticia = {
        indice: noticia.indice,
        medio: 'Rio Negro',
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

    writeFile('json/rionegro.json', JSON.stringify(noticiasCompletas,null,2))
    setTimeout(() => {browser.close()}, 2000)
  }

  // return JSON.stringify(noticias,null,2)
}
export {rionegroScrap}