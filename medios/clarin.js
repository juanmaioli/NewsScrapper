import { writeFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function clarinScrap(cantidadMaxDeNoticias = 20) {
  const url = 'https://www.clarin.com'
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
    
    // Scroll abajo para lazy load
    await page.evaluate(() => window.scrollBy(0, 1500))
    await new Promise(r => setTimeout(r, 2500))

    const allLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href))
    
    // Filtrado de links de Clarín que son noticias
    const newsLinks = [...new Set(allLinks.filter(link => {
      if (!link.startsWith('https://www.clarin.com/')) return false
      
      const path = link.replace('https://www.clarin.com/', '')
      const segments = path.split('/').filter(Boolean)
      
      // La noticia de Clarín tiene secciones y termina en .html
      if (segments.length < 2) return false
      
      // Excluir algunas páginas comunes de secciones que no son notas
      const exclusiones = ['temas', 'contacto', 'suscripcion', 'juegos', 'claringrilla', 'servicios', 'autor', 'brandstudio']
      if (exclusiones.includes(segments[0])) return false
      
      return link.endsWith('.html') && link.includes('_')
    }))]

    console.log(`[Clarín] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        const rawTitular = $n('.storyTitle').text().trim() || $n('h1').first().text().trim()
        
        // El resumen puede ser un h2.storySummary o una lista
        let rawResumen = $n('.storySummary').text().trim()
        if (!rawResumen) {
          rawResumen = $n('meta[property="og:description"]').attr('content') || ''
        }
        
        const rawImagen = $n('meta[property="og:image"]').attr('content') || ''
        const rawFecha = $n('.createDate').attr('dateTime') || $n('time').first().text().trim() || ''

        let parrafos = []
        $n('#cuerpo p, .StoryTextContainer p').each((idx, el) => {
          const txt = $n(el).text().trim()
          if (txt.length > 0) parrafos.push(txt)
        })
        
        // Fallback si los selectores cambiaron
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
            medio: 'Clarín',
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
        console.error(`Error en noticia Clarín: ${noticia.link}`, e.message)
      }
    }

    await writeFile('./public/json/clarin.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Clarín Scrap:", e.message)
    throw e;
  } finally {
    await browser.close()
  }
}

export { clarinScrap }
