import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function oleScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.ole.com.ar'
  let noticias = []
  let noticiasCompletas = []
  const browser = await puppeteer.launch({headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, args: ['--no-sandbox', '--disable-setuid-sandbox']})
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'networkidle2' })
    
    // Scrollear para cargar contenido
    await page.evaluate(() => window.scrollBy(0, 1000))
    await new Promise(r => setTimeout(r, 2000))

    const allLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href))
    
    // Filtrar links que parecen noticias (Olé suele usar .html al final)
    const newsLinks = [...new Set(allLinks.filter(link => link.startsWith(url) && link.endsWith('.html') && !link.includes('/edicion-impresa/')))]
    console.log(`[Olé] Enlaces de noticias detectados: ${newsLinks.length}`)

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
        const rawResumen = $n('.story-summary, .subtitle').text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content') || $n('article img').attr('src')
        const rawArticulo = $n('article p, .body-nota p').text().trim()
        const rawFecha = $n('time').attr('datetime') || $n('.date').text().trim() || new Date().toISOString()

        if (rawTitular) {
          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'Olé',
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
        console.error(`Error en noticia Olé: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/ole.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Olé Scrap:", e.message)
  } finally {
    await browser.close()
  }
}

export {oleScrap}
