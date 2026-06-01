import { writeFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function cronicaScrap(cantidadMaxDeNoticias = 20) {
  const url = 'https://www.cronica.com.ar'
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
    
    // Scroll abajo para activar el lazy load de imágenes y enlaces
    await page.evaluate(() => window.scrollBy(0, 1200))
    await new Promise(r => setTimeout(r, 2000))

    const allLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href))
    
    // Filtrado lógico robusto de noticias por segmentos en la URL
    const newsLinks = [...new Set(allLinks.filter(link => {
      if (!link.startsWith('https://www.cronica.com.ar/')) return false;
      const path = link.replace('https://www.cronica.com.ar/', '');
      const segments = path.split('/').filter(Boolean);
      
      // Debe tener sección y slug de noticia (mínimo 2 segmentos)
      if (segments.length < 2) return false;
      
      // Excluir secciones generales y directorios estáticos
      const exclusiones = ['tema', 'tools', 'cronicahd', 'horoscopo', 'santoral', 'efemerides', 'newsletters', 'fmq', 'depo', 'diarioshow', 'clubcronica'];
      if (exclusiones.includes(segments[0])) return false;
      
      // El segundo segmento (el slug de la noticia) debe ser descriptivo con guiones
      const slug = segments[1];
      return slug.includes('-') && slug.split('-').length >= 3;
    }))]

    console.log(`[Crónica] Enlaces de noticias detectados: ${newsLinks.length}`)

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

        // Selectores semánticos ultra-precisos validados para Crónica
        const rawTitular = $n('h1.title').text().trim() || $n('h1').text().trim()
        const rawResumen = $n('h2.description').text().trim() || $n('h2').first().text().trim()
        const rawImagen = $n('meta[property="og:image"]').attr('content')
        const rawFecha = $n('time').first().text().trim() || $n('.article-date').text().trim()

        // El cuerpo del artículo está compuesto por párrafos dentro de la etiqueta 'article'
        let parrafos = []
        $n('article p').each((idx, el) => {
          const txt = $n(el).text().trim()
          if (txt.length > 0) parrafos.push(txt)
        })
        const rawArticulo = parrafos.join('\n\n')

        if (rawTitular && rawArticulo) {
          noticiasCompletas.push({
            indice: noticia.indice,
            medio: 'Crónica',
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
        console.error(`Error en noticia Crónica: ${noticia.link}`, e.message)
      }
    }
    
    await writeFile('./public/json/cronica.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en Crónica Scrap:", e.message)
    throw e;
  } finally {
    await browser.close()
  }
}

export { cronicaScrap }
