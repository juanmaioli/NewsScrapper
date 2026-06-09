import { writeFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function zonamilitarScrap(cantidadMaxDeNoticias = 20) {
  const url = 'https://www.zona-militar.com/'
  let noticias = []
  let noticiasCompletas = []
  
  const browser = await puppeteer.launch({
    headless: "new", 
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, 
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })
    
    await page.evaluate(() => window.scrollBy(0, 1000))
    await new Promise(r => setTimeout(r, 2000))

    const allLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href))
    
    // Filtrado de links que sigan el patron YYYY/MM/DD/slug de WordPress de Zona Militar
    const newsLinks = [...new Set(allLinks.filter(link => {
      return /\/\d{4}\/\d{2}\/\d{2}\//.test(link) && !link.includes('#respond') && !link.includes('#comments');
    }))]

    console.log(`[Zona Militar] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        const rawTitular = $n('h1.entry-title').first().text().trim() || $n('.tdb-title-text').first().text().trim() || $n('h1').first().text().trim()
        const rawResumen = $n('meta[property="og:description"]').attr('content') || $n('meta[name="description"]').attr('content') || ''
        const rawImagen = $n('meta[property="og:image"]').attr('content') || ''
        const rawFecha = $n('time').first().text().trim() || $n('.entry-date').first().text().trim() || ''

        let parrafos = []
        const bodySelectors = ['.td-post-content p', '.tdb-paragraph p', 'article p']
        let foundParagraphs = false
        
        for (const selector of bodySelectors) {
          $n(selector).each((idx, el) => {
            const txt = $n(el).text().trim()
            if (txt.length > 0) {
              parrafos.push(txt)
              foundParagraphs = true
            }
          })
          if (foundParagraphs) break
        }

        const rawArticulo = parrafos.join('\n\n')

        if (rawTitular && rawArticulo) {
          noticiasCompletas.push({
            indice: noticiasCompletas.length + 1,
            medio: 'Zona Militar',
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
        console.error(`Error en noticia Zona Militar: ${noticia.link}`, e.message)
      }
    }
    
    if (noticiasCompletas.length === 0) {
      console.warn("No se extrajeron noticias para Zona Militar")
    }

    await writeFile('./public/json/zonamilitar.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Zona Militar Scrap:", e.message)
    throw e;
  } finally {
    await browser.close()
  }
}

export { zonamilitarScrap }
