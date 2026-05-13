import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function cnnespanolScrap(cantidadMaxDeNoticias=2){
  const url = 'https://cnnespanol.cnn.com'
  let noticias = []
  let noticiasCompletas = []
  const browser = await puppeteer.launch({headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, args: ['--no-sandbox', '--disable-setuid-sandbox']})
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'networkidle2' })
    
    // Scrollear para cargar contenido dinámico
    await page.evaluate(() => window.scrollBy(0, 1000))
    await new Promise(r => setTimeout(r, 2000))

    const allLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href))
    
    // Filtrar links que parecen noticias (patrón de fecha: /YYYY/MM/DD/)
    const newsLinks = [...new Set(allLinks.filter(link => /\/\d{4}\/\d{2}\/\d{2}\//.test(link)))]
    console.log(`[CNN en Español] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        const rawTitular = $n('h1').first().text().trim()
        const rawResumen = $n('.story-summary, .subtitle, h2').first().text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content') || $n('article img').attr('src')
        const rawArticulo = $n('article p, .body-nota p, .storyfull__body p').text().trim()
        const rawFecha = $n('time').attr('datetime') || $n('.date').text().trim() || new Date().toISOString()

        if (rawTitular) {
          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'CNN en Español',
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
        console.error(`Error en noticia CNN en Español: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/cnnespanol.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en CNN en Español Scrap:", e.message)
  } finally {
    await browser.close()
  }
}

export {cnnespanolScrap}
