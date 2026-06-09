import { writeFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function galaxiamilitarScrap(cantidadMaxDeNoticias = 20) {
  const url = 'https://galaxiamilitar.es/'
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
    
    const newsLinks = [...new Set(allLinks.filter(link => {
      if (!link.startsWith('https://galaxiamilitar.es/')) return false;
      const path = link.replace('https://galaxiamilitar.es/', '');
      if (path.startsWith('#') || path === '') return false;
      const segments = path.split('/').filter(Boolean);
      if (segments.length !== 1) return false;
      const exclusiones = ['contacto', 'aviso-legal', 'category', 'tag', 'author', 'wp-content', 'feed'];
      return !exclusiones.some(exc => segments[0].includes(exc));
    }))]

    console.log(`[Galaxia Militar] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        const rawTitular = $n('h1.entry-title').first().text().trim() || $n('h1').first().text().trim()
        const rawResumen = $n('meta[property="og:description"]').attr('content') || $n('meta[name="description"]').attr('content') || ''
        const rawImagen = $n('meta[property="og:image"]').attr('content') || ''
        const rawFecha = $n('time.entry-date').first().text().trim() || $n('time').first().text().trim() || ''

        let parrafos = []
        // Secciones comunes de contenido en el theme ColorMag Pro usado por Galaxia Militar
        const bodySelectors = ['.cm-entry-summary p', '.entry-content p', 'article p']
        let foundParagraphs = false;
        
        for (const selector of bodySelectors) {
          $n(selector).each((idx, el) => {
            const txt = $n(el).text().trim()
            if (txt.length > 0 && !$n(el).hasClass('comment-notes')) {
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
            medio: 'Galaxia Militar',
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
        console.error(`Error en noticia Galaxia Militar: ${noticia.link}`, e.message)
      }
    }
    
    if (noticiasCompletas.length === 0) {
      console.warn("No se extrajeron noticias para Galaxia Militar")
    }

    await writeFile('./public/json/galaxiamilitar.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Galaxia Militar Scrap:", e.message)
    throw e;
  } finally {
    await browser.close()
  }
}

export { galaxiamilitarScrap }
