import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

async function tnScrap(cantidadMaxDeNoticias=20){
  const url = 'https://tn.com.ar'
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
      // Patrón de noticias de TN: /seccion/año/mes/dia/slug/
      if (href && /\/\d{4}\/\d{2}\/\d{2}\//.test(href)) {
        const fullLink = href.startsWith('http') ? href : url + href
        if (!newsLinks.includes(fullLink)) {
          newsLinks.push(fullLink)
        }
      }
    })

    console.log(`[TN] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        const rawTitular = $n('h1').first().text().trim() || $n('.article__title').text().trim()
        const rawResumen = $n('h2').first().text().trim() || $n('.article__sub-title').text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content')
        const rawArticulo = $n('.article__body p').text().trim() || $n('article p').text().trim()
        const rawFecha = $n('time').first().text().trim() || $n('.article__date').text().trim()

        if (rawTitular) {
          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'TN',
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
        console.error(`Error en noticia TN: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/tn.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en TN Scrap:", e.message)
    throw e;
  }
}

export {tnScrap}
