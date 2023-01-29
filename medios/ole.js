import {writeFile} from 'node:fs/promises'
import * as cheerio from 'cheerio'
import * as puppeteer from 'puppeteer'


async function OleScrap(cantidadMaxDeNoticias=2){
  const url = 'https://www.ole.com.ar/'
  const browser = await puppeteer.launch({headless: true,args: ['--no-sandbox', '--disable-setuid-sandbox']})
  await browser.createIncognitoBrowserContext()
  const page = await browser.newPage()
  //Para evirar que se detecte el bot al usar {headless: true}
  await page.setUserAgent('Mozilla/5.0 (Windows NT 5.1; rv:5.0) Gecko/20100101 Firefox/5.0')
  await page.goto(url)
  const content = await page.content()
  const $ = cheerio.load(content)

  let noticias = []
  let noticiasCompletas = []
  let total = 0


  //Ole Noticias
  $('.dmpSds').each((index,el)=>{
    total++
    if(total >= cantidadMaxDeNoticias){return}
    const rawlink = $(el).find('a').attr('href')
    const datosNoticia = {
      indice: total,
      link:rawlink,
    }
    if(rawlink){
      if(rawlink.includes('undefined') == false){
        noticias.push(datosNoticia)
      }
    }
  })

  // writeFile('json/oleList.json', JSON.stringify(noticias,null,2), (err) => {if (err) throw err})

  for (let noticia of noticias){
    const url = noticia.link
    // console.log(noticia.indice , ') Obteniendo: ',  url)
    const pagina = await fetch(url)
    const contenido = await pagina.text()
    const $ = cheerio.load(contenido)
    $('ul').remove()
    $('header').remove()
    $('svg').remove()
    $('script').remove()
    $('.sc-489cef11-0').remove()
    $('.sc-6964e9bc-0').remove()
    $('.back').remove()
    $('.title-comments').remove()
    $('.bann').remove()
    $('.video').remove()
    $('#wb_meter').remove()
    $('footer').remove()

    const rawFecha = $('.modificatedDate').text()
    $('body').each((index,el)=>{
      const rawTitular = $(el).find('.sc-6d5ed123-3').html()
      const rawlink = url
      const rawImagen = $(el).find('picture > img').attr('src')
      const rawResumen =  $(el).find('.sc-789c2df9-7').html()
      const rawArticulo = $(el).find('p').text()

      const datosNoticia = {
        indice: noticia.indice,
        medio: 'Olé',
        fechaObtenido: Math.floor(Date.now() / 1000),
        fechaArticulo : rawFecha,
        link:rawlink,
        titular:rawTitular,
        resumen:rawResumen,
        articulo:rawArticulo,
        imagen:rawImagen,
      }

      noticiasCompletas.push(datosNoticia)
    })
    writeFile('json/ole.json',JSON.stringify(noticiasCompletas,null,2), (err) => {if (err) throw err})
    setTimeout(() => {
      browser.close()
    }, 2000)
    // let noticias = []
    // let total = 0

  }

}
export{OleScrap}