import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function rionegroScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.rionegro.com.ar/'
  const browser = await puppeteer.launch({headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, args: ['--no-sandbox', '--disable-setuid-sandbox']})
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2' })
    const content = await page.content()
    const $ = cheerio.load(content)
    let noticiasCompletas = []
    let noticias = []
    let total = 0

    $('.news__title').each((index,el)=>{
      if(total >= cantidadMaxDeNoticias){return}
      const rawLink = $(el).find('a').attr('href')
      if(rawLink && !['/cartas/', '/en-casa/', '/opinion/', '/energia/', '/digo/', '/horoscopo/', '/sociedad/', '/gastronomia/'].some(path => rawLink.includes(path))){
        total++
        noticias.push({ indice: total, link: rawLink })
      }
    })

    for (let noticia of noticias){
      try {
        const pagina = await fetch(noticia.link)
        const contenido = await pagina.text()
        const $n = cheerio.load(contenido)
        
        $n('.col--aside, .newsfull__tags, .row.recomendations, #comments__section, #suscribite__section, [id^="inline"], .wp-block-lazyblock-subtitulo-h2, .wp-block-separator, .newsfull__share, figcaption, .newsfull__authors_media, h2, span, .newsfull__authors_data').remove()

        $n('.newsfull').each((index, el)=>{
          const rawTitular = $n(el).find('.newsfull__title').text().trim()
          const rawImagen = $n(el).find('.photogallery__image > img').attr('src')
          const rawFecha = $n(el).find('.newsfull__time').text().slice(0,10).trim()
          const rawResumen = $n(el).find('.newsfull__excerpt > .newsfull__excerpt').text().replace(/(\r\n|\n|\r|\t)/gm,'').trim()
          const rawArticulo = $n(el).find('P').text().replace(/(\r\n|\n|\r|\t)/gm,'').trim()

          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'Rio Negro',
            fechaObtenido: Math.floor(Date.now() / 1000),
            fechaArticulo : rawFecha,
            link: noticia.link,
            titular: rawTitular,
            resumen: rawResumen,
            articulo: rawArticulo,
            imagen: rawImagen,
          })
        })
      } catch (e) {
        console.error(`Error procesando noticia de Rio Negro: ${noticia.link}`, e)
      }
    }
    await writeFile('./public/json/rionegro.json', JSON.stringify(noticiasCompletas, null, 2))
  } finally {
    await browser.close()
  }
}
export {rionegroScrap}
