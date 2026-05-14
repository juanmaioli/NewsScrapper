import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function googlenewsScrap(cantidadMaxDeNoticias=12){
  const url = 'https://news.google.com?hl=es-419&gl=AR&ceid=AR:es-419'
  let noticiasCompletas = []
  const browser = await puppeteer.launch({headless: "new", executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, args: ['--no-sandbox', '--disable-setuid-sandbox']})
  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    await page.goto(url, { waitUntil: 'networkidle2' })
    
    await page.evaluate(() => window.scrollBy(0, 1000))
    await new Promise(r => setTimeout(r, 3000))

    const articles = await page.evaluate(() => {
      const results = []
      // Buscamos elementos que parecen tarjetas de noticias (Google News usa etiquetas <article>)
      const items = Array.from(document.querySelectorAll('article'))
      
      for (const item of items) {
        // Encontrar el link (generalmente el primer <a> con href que contiene ./articles/)
        const linkEl = item.querySelector('a[href*="./articles/"]')
        const titleEl = item.querySelector('h3, h4') || (linkEl ? linkEl.parentElement : null)
        
        // Intentar obtener el nombre del medio
        const sourceEl = Array.from(item.querySelectorAll('div, span, a')).find(el => el.getAttribute('data-n-tid') || (el.innerText && el.innerText.length > 2 && el.innerText.length < 30 && !el.innerText.includes('\n')))

        if (titleEl && linkEl) {
          const titular = titleEl.innerText.trim()
          if (titular.length > 10) { // Evitar ruidos
            results.push({
              titular: titular,
              link: linkEl.href,
              medio: sourceEl ? sourceEl.innerText.trim() : 'Google News',
              fechaArticulo: 'Reciente'
            })
          }
        }
      }
      return results
    })

    console.log(`[Google News] Noticias detectadas: ${articles.length}`)

    // Para Google News, no entramos a cada noticia porque son sitios externos aleatorios.
    // Usamos los metadatos de la propia plataforma.
    for (let i = 0; i < Math.min(articles.length, cantidadMaxDeNoticias); i++) {
      const art = articles[i]
      noticiasCompletas.push({
        indice: i + 1,
        medio: art.medio,
        fechaObtenido: Math.floor(Date.now() / 1000),
        fechaArticulo: art.fechaArticulo,
        link: art.link,
        titular: art.titular,
        resumen: 'Vía Google News - ' + art.medio,
        articulo: 'Esta noticia fue agregada desde Google News. Hacé clic en "Ver" para leer el contenido completo en la fuente original.',
        imagen: './img/No-Image-Placeholder.svg' // Google News usa imágenes con lazy load complejas, usamos placeholder
      })
    }

    await writeFile('./public/json/googlenews.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Google News Scrap:", e.message)
  } finally {
    await browser.close()
  }
}

export {googlenewsScrap}
