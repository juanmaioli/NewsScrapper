import { writeFile } from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'

async function thehearScrap(cantidadMaxDeNoticias = 20) {
  const url = 'https://www.thehear.org/en/spain'
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
    
    // Dejar un segundo para renderizar React
    await new Promise(r => setTimeout(r, 2000))

    const html = await page.content()
    const $ = cheerio.load(html)
    
    // Intentar extraer el JSON-LD que contiene los titulares estructurados
    const jsonLdScript = $('script[type="application/ld+json"]').filter((idx, el) => {
      const txt = $(el).text()
      return txt.includes('ItemList') || txt.includes('itemListElement')
    }).first()

    if (jsonLdScript.length > 0) {
      try {
        const jsonLdData = JSON.parse($(jsonLdScript).text())
        
        // El JSON-LD puede tener estructura directa o estar en un grafo @graph
        let items = []
        if (jsonLdData.itemListElement) {
          items = jsonLdData.itemListElement
        } else if (jsonLdData['@graph']) {
          const listObject = jsonLdData['@graph'].find(obj => obj['@type'] === 'ItemList')
          if (listObject && listObject.itemListElement) {
            items = listObject.itemListElement
          }
        }

        console.log(`[The Hear] Detectados ${items.length} items estructurados en JSON-LD`)

        for (let i = 0; i < Math.min(items.length, cantidadMaxDeNoticias); i++) {
          const rawItem = items[i].item || items[i]
          const rawTitular = rawItem.headline || rawItem.name
          const rawLink = rawItem.url
          const rawFecha = rawItem.datePublished || ''
          const rawMedio = rawItem.publisher ? rawItem.publisher.name : 'The Hear'
          const rawResumen = rawItem.description || ''

          if (rawTitular && rawLink) {
            noticiasCompletas.push({
              indice: noticiasCompletas.length + 1,
              medio: `The Hear (${rawMedio})`,
              fechaObtenido: Math.floor(Date.now() / 1000),
              fechaArticulo: rawFecha ? new Date(rawFecha).toLocaleDateString('es-AR') : '',
              link: rawLink,
              titular: rawTitular,
              resumen: rawResumen,
              articulo: rawResumen || `Titular internacional consolidado por The Hear para España. Nota original en: ${rawMedio}`,
              imagen: 'https://www.thehear.org/logo192.png' // Imagen predeterminada
            })
          }
        }
      } catch (jsonErr) {
        console.error("Error al parsear JSON-LD en The Hear:", jsonErr.message)
      }
    }

    // Fallback: Si no pudimos recuperar noticias estructuradas, usar selectores del DOM
    if (noticiasCompletas.length === 0) {
      console.log("[The Hear] Usando fallback de selectores CSS...")
      
      const cards = $('.source-card, .group').filter((idx, el) => {
        return $(el).find('h3').length > 0
      })

      console.log(`[The Hear] Encontradas ${cards.length} cards visuales`)

      cards.each((idx, el) => {
        if (noticiasCompletas.length >= cantidadMaxDeNoticias) return

        const card = $(el)
        const rawTitular = card.find('h3').first().text().trim()
        const rawLink = card.find('a').first().attr('href')
        const rawMedio = card.find('h2').first().text().trim() || 'The Hear'
        
        if (rawTitular && rawLink) {
          noticiasCompletas.push({
            indice: noticiasCompletas.length + 1,
            medio: `The Hear (${rawMedio})`,
            fechaObtenido: Math.floor(Date.now() / 1000),
            fechaArticulo: new Date().toLocaleDateString('es-AR'),
            link: rawLink.startsWith('http') ? rawLink : `https://www.thehear.org${rawLink}`,
            titular: rawTitular,
            resumen: '',
            articulo: `Titular internacional consolidado por The Hear para España. Nota original en: ${rawMedio}`,
            imagen: 'https://www.thehear.org/logo192.png'
          })
        }
      })
    }

    console.log(`[The Hear] Total de noticias finales extraídas: ${noticiasCompletas.length}`)
    await writeFile('./public/json/thehear.json', JSON.stringify(noticiasCompletas, null, 2))
  } catch (e) {
    console.error("Error en The Hear Scrap:", e.message)
    throw e;
  } finally {
    await browser.close()
  }
}

export { thehearScrap }
