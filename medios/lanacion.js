import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function lanacionScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.lanacion.com.ar'
  let noticias = []
  let noticiasCompletas = []
  const browser = await puppeteer.launch({headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, args: ['--no-sandbox', '--disable-setuid-sandbox']})
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'networkidle2' })
    
    await page.evaluate(() => window.scrollBy(0, 1000))
    await new Promise(r => setTimeout(r, 2000))

    const allLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href))
    
    // Filtrar links que parecen noticias (patrón: -nidXXXXXXXX/)
    const newsLinks = [...new Set(allLinks.filter(link => /-nid\d+\/$/.test(link)))]
    console.log(`[La Nacion] Enlaces de noticias detectados: ${newsLinks.length}`)

    for (let i = 0; i < Math.min(newsLinks.length, cantidadMaxDeNoticias); i++) {
      noticias.push({ indice: i + 1, link: newsLinks[i] })
    }

    for (let noticia of noticias) {
      try {
        const resp = await fetch(noticia.link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        })
        const html = await resp.text()
        const $n = cheerio.load(html)

        const rawTitular = $n('h1.com-title').text().trim() || $n('h1').first().text().trim()
        const rawResumen = $n('h2.com-sub-title').text().trim() || $n('.com-subhead').text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content') || $n('figure.com-image img').attr('src')
        const rawArticulo = $n('section.com-content p').text().trim() || $n('main p').text().trim() || $n('article p').text().trim()
        const rawFecha = $n('time.com-date').text().trim() || $n('.com-date').text().trim()

        if (rawTitular) {
          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'La Nacion',
            fechaObtenido: Math.floor(Date.now() / 1000),
            fechaArticulo: rawFecha,
            link: noticia.link,
            titular: rawTitular,
            resumen: rawResumen,
            articulo: rawArticulo,
            imagen: rawImagen,
          })
        }
      } catch (e) {
        console.error(`Error en noticia La Nacion: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/lanacion.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en La Nacion Scrap:", e.message)
  } finally {
    await browser.close()
  }
}

export {lanacionScrap}
