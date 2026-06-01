import { writeFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function argentinagobScrap(cantidadMaxDeNoticias = 20) {
  const url = 'https://www.argentina.gob.ar/noticias'
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
    
    // Links de noticias de argentina.gob.ar
    const newsLinks = [...new Set(allLinks.filter(link => {
      return link.startsWith('https://www.argentina.gob.ar/noticias/') && link.split('/').length >= 5
    }))]

    console.log(`[Argentina Gob] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        const rawTitular = $n('.title-description h1').text().trim() || $n('h1').first().text().trim()
        const rawResumen = $n('.news__lead p').first().text().trim() || $n('meta[property="og:description"]').attr('content') || ''
        const rawImagen = $n('meta[property="og:image"]').attr('content') || ''
        const rawFecha = $n('.news__time time').first().text().trim() || $n('time').first().text().trim() || ''

        let parrafos = []
        $n('.content_format p, .pane-content p').each((idx, el) => {
          const txt = $n(el).text().trim()
          if (txt.length > 0) parrafos.push(txt)
        })

        const rawArticulo = parrafos.slice(0, 10).join('\n\n')

        if (rawTitular && rawArticulo) {
          noticiasCompletas.push({
            indice: noticiasCompletas.length + 1,
            medio: 'Argentina Gob',
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
        console.error(`Error en noticia Argentina Gob: ${noticia.link}`, e.message)
      }
    }

    await writeFile('./public/json/argentinagob.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Argentina Gob Scrap:", e.message)
    throw e;
  } finally {
    await browser.close()
  }
}

export { argentinagobScrap }
