import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function cronistaScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.cronista.com'
  let noticias = []
  let noticiasCompletas = []
  const browser = await puppeteer.launch({headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox']})
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2' })
    const content = await page.content()
    const $ = cheerio.load(content)

    $('article').each((index, el) => {
      if (noticias.length >= cantidadMaxDeNoticias) return
      const href = $(el).find('a').attr('href')
      if (href) {
        const fullLink = href.startsWith('http') ? href : url + href
        noticias.push({ indice: noticias.length + 1, link: fullLink })
      }
    })

    for (let noticia of noticias) {
      try {
        const articlePage = await browser.newPage()
        await articlePage.goto(noticia.link, { waitUntil: 'domcontentloaded', timeout: 30000 })
        const html = await articlePage.content()
        const $n = cheerio.load(html)

        const rawTitular = $n('h1').first().text().trim()
        const rawResumen = $n('.article-container h2').text().trim() || $n('.description').text().trim() || $n('h2').first().text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content') || $n('.article-main-image img').attr('src')
        const rawArticulo = $n('.article-body p').map((i, el) => $n(el).text()).get().join('\n\n').trim() || $n('#pagecontent p').text().trim()
        const rawFecha = $n('.article-date').text().trim() || new Date().toLocaleDateString('es-AR')

        if (rawTitular) {
          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'El Cronista',
            fechaObtenido: Math.floor(Date.now() / 1000),
            fechaArticulo: rawFecha,
            link: noticia.link,
            titular: rawTitular,
            resumen: rawResumen,
            articulo: rawArticulo,
            imagen: rawImagen,
          })
        }
        await articlePage.close()
      } catch (e) {
        console.error(`Error en noticia El Cronista: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/cronista.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en El Cronista Scrap:", e.message)
  } finally {
    await browser.close()
  }
}

export {cronistaScrap}
