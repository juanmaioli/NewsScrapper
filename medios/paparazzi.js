import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

async function paparazziScrap(cantidadMaxDeNoticias=20){
  const url = 'https://www.paparazzi.com.ar'
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

    // Buscamos enlaces que parezcan noticias (patrón: /seccion/titulo-slug/)
    // En Paparazzi suelen ser enlaces directos bajo categorías como /teve/, /romances/, etc.
    const newsLinks = []
    $('a').each((index, el) => {
      const href = $(el).attr('href')
      // Filtramos por patrones comunes de categorías y evitamos páginas técnicas
      if (href && /^https:\/\/www\.paparazzi\.com\.ar\/(teve|romances|looks|internacionales|deportes|horoscopo)\/.+/.test(href)) {
        if (!newsLinks.includes(href) && !href.includes('/page/')) {
          newsLinks.push(href)
        }
      }
    })

    console.log(`[Paparazzi] Enlaces de noticias detectados: ${newsLinks.length}`)

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
            medio: 'Paparazzi',
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
        console.error(`Error en noticia Paparazzi: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/paparazzi.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Paparazzi Scrap:", e.message)
    throw e;
  }
}

export {paparazziScrap}
