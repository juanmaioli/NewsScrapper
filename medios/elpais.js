import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function elpaisScrap(cantidadMaxDeNoticias=20){
  const url = 'https://elpais.com'
  const domain = 'https://elpais.com'
  let noticias = []
  let noticiasCompletas = []
  const browser = await puppeteer.launch({headless: true, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, args: ['--no-sandbox', '--disable-setuid-sandbox']})
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'networkidle2' })
    
    // Scrollear para cargar contenido dinámico
    await page.evaluate(() => window.scrollBy(0, 1500))
    await new Promise(r => setTimeout(r, 2000))

    const allLinks = await page.evaluate(() => {
        // Buscamos enlaces dentro de artículos o encabezados h2/h3
        return Array.from(document.querySelectorAll('article h2 a, article h3 a, .c_t a')).map(a => a.href)
    })
    
    // Filtrar links únicos que parezcan noticias (evitar secciones genéricas, tags, etc.)
    const newsLinks = [...new Set(allLinks.filter(link => 
        link.startsWith('https://elpais.com/') && 
        link.length > 40 && 
        !link.includes('/tag/') && 
        !link.includes('/autor/') &&
        !link.endsWith('.html') === false // Muchos terminan en .html
    ))]
    
    console.log(`[El País] Enlaces de noticias totales detectados: ${newsLinks.length}`)

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
        const rawResumen = $n('h2').first().text().trim() || $n('.article-lead').text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content') || $n('figure img').attr('src')
        const rawArticulo = $n('div[data-dtm-region="articulo_cuerpo"] p').text().trim() || $n('article p').text().trim()
        const rawFecha = $n('time').attr('datetime') || $n('meta[property="article:published_time"]').attr('content') || new Date().toLocaleDateString('es-ES')

        if (rawTitular) {
          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'El País',
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
        console.error(`Error en noticia El País: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/elpais.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en El País Scrap:", e.message)
  } finally {
    await browser.close()
  }
}

export {elpaisScrap}
