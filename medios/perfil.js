import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'

async function perfilScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.perfil.com'
  let noticias = []
  let noticiasCompletas = []
  try {
    const pagina = await fetch(url)
    const content = await pagina.text()
    const $ = cheerio.load(content)

    $('article').each((index, el) => {
      if (noticias.length >= cantidadMaxDeNoticias) return
      const href = $(el).find('a').attr('href')
      if (href) {
        const fullLink = href.startsWith('http') ? href : url + href
        noticias.push({ indice: noticias.length + 1, link: fullLink })
      }
    })

    for (let noticia of noticias) {
      try {
        const resp = await fetch(noticia.link)
        const html = await resp.text()
        const $n = cheerio.load(html)

        const rawTitular = $n('h1.article-title').text().trim() || $n('h1').text().trim()
        const rawResumen = $n('.article-sub-title').text().trim() || $n('.headline').text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content') || $n('figure img').attr('src')
        const rawArticulo = $n('.article-body p').text().trim() || $n('.supercontenedor p').text().trim()
        const rawFecha = $n('.article-date').text().trim() || $n('.fecha').text().trim()

        noticiasCompletas.push({
          indice: noticia.indice,
          medio: 'Perfil',
          fechaObtenido: Math.floor(Date.now() / 1000),
          fechaArticulo: rawFecha,
          link: noticia.link,
          titular: rawTitular,
          resumen: rawResumen,
          articulo: rawArticulo,
          imagen: rawImagen,
        })
      } catch (e) {
        console.error(`Error en noticia Perfil: ${noticia.link}`, e.message)
      }
    }
    await writeFile('./public/json/perfil.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Perfil Scrap:", e.message)
  }
}

export {perfilScrap}
