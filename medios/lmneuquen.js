import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

async function lmneuquenScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.lmneuquen.com'
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

    const articles = $('article, .article-highlighted-md, .article-list-xl')
    console.log(`[Lmneuquen] Artículos encontrados en portada: ${articles.length}`)

    articles.each((index, el) => {
      if (noticias.length >= cantidadMaxDeNoticias) return
      const href = $(el).find('a').attr('href')
      if (href) {
        const fullLink = href.startsWith('http') ? href : url + href
        if (!noticias.find(n => n.link === fullLink)) {
          noticias.push({ indice: noticias.length + 1, link: fullLink })
        }
      }
    })

    for (let noticia of noticias) {
      try {
        const resp = await fetch(noticia.link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        })
        const html = await resp.text()
        const $n = cheerio.load(html)

        const rawTitular = $n('h1.title').text().trim() || $n('h1').text().trim()
        const rawResumen = $n('h2.subtitle').text().trim() || $n('h2').text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content') || $n('.main-image img').attr('src')
        const rawArticulo = $n('.article-body p').text().trim() || $n('main p').text().trim()
        const rawFecha = $n('.date').text().trim() || $n('.grouper.date').attr('datetime')

        if (rawTitular) {
          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'Lmneuquen',
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
        console.error(`Error en noticia Lmneuquen: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/lmneuquen.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Lmneuquen Scrap:", e.message)
    throw e;
  }
}

export {lmneuquenScrap}
