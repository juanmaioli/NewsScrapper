import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

async function genteScrap(cantidadMaxDeNoticias=20){
  const url = 'https://www.revistagente.com'
  let noticias = []
  let noticiasCompletas = []
  try {
    const pagina = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    const content = await pagina.text()
    const $ = cheerio.load(content)

    const newsLinks = []
    $('a').each((index, el) => {
      const href = $(el).attr('href')
      // Patrones de categorías comunes en Gente (Atlantida)
      if (href && /^https:\/\/www\.revistagente\.com\/(entretenimiento|actualidad|lifestyle|intimos|looks|realeza|personajes)\/.+/.test(href)) {
        if (!newsLinks.includes(href) && !href.includes('/page/')) {
          newsLinks.push(href)
        }
      }
    })

    console.log(`[Gente] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        const rawTitular = $n('h1.single-article__title').text().trim() || $n('h1').first().text().trim()
        const rawResumen = $n('.single-article__summary').text().trim() || $n('.single-article__excerpt').text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content')
        const rawArticulo = $n('.single-article__body p').text().trim() || $n('article p').text().trim()
        const rawFecha = $n('.single-article__date').text().trim() || $n('time').text().trim()

        if (rawTitular) {
          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'Gente',
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
        console.error(`Error en noticia Gente: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/gente.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Gente Scrap:", e.message)
  }
}

export {genteScrap}
