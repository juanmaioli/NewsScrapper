import { writeFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function noticiasnqnScrap(cantidadMaxDeNoticias = 20) {
  const url = 'https://www.noticiasnqn.com.ar'
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
    
    // Scroll abajo
    await page.evaluate(() => window.scrollBy(0, 1000))
    await new Promise(r => setTimeout(r, 2000))

    const allLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href))
    
    // Filtrado robusto de links a noticiasnqn
    const newsLinks = [...new Set(allLinks.filter(link => {
      // Coincide con /noticias/YYYY/MM/DD/ID-slug
      return link.includes('/noticias/20') && link.includes('-')
    }))]

    console.log(`[Noticias NQN] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        const rawTitular = $n('.noticia-titulo').first().text().trim() || $n('h1').first().text().trim()
        const rawResumen = $n('.noticia-copete').first().text().trim() || $n('meta[property="og:description"]').attr('content') || ''
        const rawImagen = $n('meta[property="og:image"]').attr('content') || ''
        const rawFecha = $n('.noticia-fecha').first().text().trim() || ''

        let parrafos = []
        $n('.noticia-contenido p').each((idx, el) => {
          const txt = $n(el).text().trim()
          if (txt.length > 0 && !$n(el).hasClass('noticia-relacionada')) {
            parrafos.push(txt)
          }
        })
        
        // Fallback si no encuentra contenido bajo noticia-contenido
        if (parrafos.length === 0) {
          $n('p').each((idx, el) => {
            const txt = $n(el).text().trim()
            if (txt.length > 30 && !$n(el).hasClass('noticia-relacionada')) {
              parrafos.push(txt)
            }
          })
        }

        const rawArticulo = parrafos.slice(0, 10).join('\n\n')

        if (rawTitular && rawArticulo) {
          noticiasCompletas.push({
            indice: noticiasCompletas.length + 1,
            medio: 'Noticias NQN',
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
        console.error(`Error en noticia Noticias NQN: ${noticia.link}`, e.message)
      }
    }
    
    // Si no logramos recopilar artículos, lanzar advertencia
    if (noticiasCompletas.length === 0) {
      console.warn("No se extrajeron noticias para Noticias NQN")
    }

    await writeFile('./public/json/noticiasnqn.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Noticias NQN Scrap:", e.message)
    throw e;
  } finally {
    await browser.close()
  }
}

export { noticiasnqnScrap }
