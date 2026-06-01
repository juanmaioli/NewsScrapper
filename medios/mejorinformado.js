import { writeFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function mejorinformadoScrap(cantidadMaxDeNoticias = 20) {
  const url = 'https://www.mejorinformado.com'
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
    
    // Filtrado de enlaces de Mejor Informado
    const newsLinks = [...new Set(allLinks.filter(link => {
      if (!link.startsWith('https://www.mejorinformado.com/')) return false
      
      const path = link.replace('https://www.mejorinformado.com/', '')
      const segments = path.split('/').filter(Boolean)
      if (segments.length < 2) return false
      
      const slug = segments[1]
      // Termina en _ID (ej. _1780282916)
      return slug.includes('_') && !isNaN(slug.split('_').pop())
    }))]

    console.log(`[Mejor Informado] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        const rawTitular = $n('.articulo__titulo').text().trim() || $n('h1').first().text().trim()
        const rawResumen = $n('.articulo__intro').text().trim() || $n('meta[property="og:description"]').attr('content') || ''
        const rawImagen = $n('meta[property="og:image"]').attr('content') || ''
        const rawFecha = $n('.articulo__fecha').first().text().trim() || ''

        let parrafos = []
        $n('.articulo__cuerpo p, main.articulo__cuerpo p').each((idx, el) => {
          const txt = $n(el).text().trim()
          if (txt.length > 0) parrafos.push(txt)
        })
        
        // Fallback
        if (parrafos.length === 0) {
          $n('article p').each((idx, el) => {
            const txt = $n(el).text().trim()
            if (txt.length > 30) parrafos.push(txt)
          })
        }

        const rawArticulo = parrafos.slice(0, 10).join('\n\n')

        if (rawTitular && rawArticulo) {
          noticiasCompletas.push({
            indice: noticiasCompletas.length + 1,
            medio: 'Mejor Informado',
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
        console.error(`Error en noticia Mejor Informado: ${noticia.link}`, e.message)
      }
    }

    await writeFile('./public/json/mejorinformado.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Mejor Informado Scrap:", e.message)
    throw e;
  } finally {
    await browser.close()
  }
}

export { mejorinformadoScrap }
