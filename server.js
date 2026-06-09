import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';


// Importación de scrapers
import { infobaeScrap } from './medios/infobae.js';
import { lmneuquenScrap } from './medios/lmneuquen.js';
import { rionegroScrap } from './medios/rionegro.js';
import { perfilScrap } from './medios/perfil.js';
import { cronistaScrap } from './medios/cronista.js';
import { lanacionScrap } from './medios/lanacion.js';
import { oleScrap } from './medios/ole.js';
import { cnnespanolScrap } from './medios/cnnespanol.js';
import { elpaisScrap } from './medios/elpais.js';
import { googlenewsScrap } from './medios/googlenews.js';
import { prontoScrap } from './medios/pronto.js';
import { paparazziScrap } from './medios/paparazzi.js';
import { genteScrap } from './medios/gente.js';
import { carasScrap } from './medios/caras.js';
import { tnScrap } from './medios/tn.js';
import { cronicaScrap } from './medios/cronica.js';
import { noticiasnqnScrap } from './medios/noticiasnqn.js';
import { argentinagobScrap } from './medios/argentinagob.js';
import { clarinScrap } from './medios/clarin.js';
import { mejorinformadoScrap } from './medios/mejorinformado.js';
import { thehearScrap } from './medios/thehear.js';
import { infodefensaScrap } from './medios/infodefensa.js';
import { galaxiamilitarScrap } from './medios/galaxiamilitar.js';
import { zonamilitarScrap } from './medios/zonamilitar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8053;

// Middleware global para desactivar el caché del navegador (No-Cache estricto)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});



// Mapeo de medios a funciones de scrap
const scraperMap = {
  'cronica.json': { name: 'Crónica', fn: cronicaScrap },
  'infobae.json': { name: 'Infobae', fn: infobaeScrap },
  'lmneuquen.json': { name: 'Lmneuquen', fn: lmneuquenScrap },
  'rionegro.json': { name: 'Rio Negro', fn: rionegroScrap },
  'perfil.json': { name: 'Perfil', fn: perfilScrap },
  'cronista.json': { name: 'El Cronista', fn: cronistaScrap },
  'lanacion.json': { name: 'La Nacion', fn: lanacionScrap },
  'ole.json': { name: 'Olé', fn: oleScrap },
  'cnnespanol.json': { name: 'CNN en Español', fn: cnnespanolScrap },
  'elpais.json': { name: 'El País', fn: elpaisScrap },
  'googlenews.json': { name: 'Google News', fn: googlenewsScrap },
  'pronto.json': { name: 'Pronto', fn: prontoScrap },
  'paparazzi.json': { name: 'Paparazzi', fn: paparazziScrap },
  'gente.json': { name: 'Revista Gente', fn: genteScrap },
  'caras.json': { name: 'Revista Caras', fn: carasScrap },
  'tn.json': { name: 'TN', fn: tnScrap },
  'noticiasnqn.json': { name: 'Noticias NQN', fn: noticiasnqnScrap },
  'argentinagob.json': { name: 'Argentina Gob', fn: argentinagobScrap },
  'clarin.json': { name: 'Clarín', fn: clarinScrap },
  'mejorinformado.json': { name: 'Mejor Informado', fn: mejorinformadoScrap },
  'thehear.json': { name: 'The Hear (España)', fn: thehearScrap },
  'infodefensa.json': { name: 'Infodefensa', fn: infodefensaScrap },
  'galaxiamilitar.json': { name: 'Galaxia Militar', fn: galaxiamilitarScrap },
  'zonamilitar.json': { name: 'Zona Militar', fn: zonamilitarScrap }
};

// Estado de scraping activo
const activeScrapes = new Set();

// Endpoint para disparar el scraping on-demand (Síncrono y en Tiempo Real)
app.get('/api/scrap/:medio', async (req, res) => {
  const medioId = req.params.medio;
  const scraper = scraperMap[medioId];

  if (!scraper) {
    return res.status(404).json({ error: 'Medio no encontrado' });
  }

  if (activeScrapes.has(medioId)) {
    return res.json({ success: true, message: `La actualización de ${scraper.name} ya está en curso.`, status: 'processing' });
  }

  const limit = parseInt(req.query.limit) || 20;

  // Iniciamos el proceso de scraping en tiempo real
  activeScrapes.add(medioId);
  console.log(`⏳ [Realtime] Iniciando actualización en tiempo real para: ${scraper.name} (Límite: ${limit})`);

  try {
    // Esperamos a que finalice la ejecución del scraping en tiempo real
    await scraper.fn(limit);
    console.log(`✅ [Realtime] Actualización completada con éxito para: ${scraper.name}`);
    res.json({ 
      success: true, 
      message: `Scraping de ${scraper.name} finalizado con éxito.`,
      status: 'updated'
    });
  } catch (error) {
    console.error(`❌ [Realtime] Error al actualizar ${scraper.name}:`, error);
    res.status(500).json({ 
      error: `Error al realizar el scraping en tiempo real de ${scraper.name}: ${error.message}` 
    });
  } finally {
    activeScrapes.delete(medioId);
  }
});

// Servir archivos estáticos solo desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de servidor (HTTPS opcional)
const sslPath = path.join(__dirname, 'ssl');
const useHttps = fs.existsSync(path.join(sslPath, 'apache.key')) && fs.existsSync(path.join(sslPath, 'apache.crt'));

if (useHttps) {
  const options = {
    key: fs.readFileSync(path.join(sslPath, 'apache.key')),
    cert: fs.readFileSync(path.join(sslPath, 'apache.crt'))
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log(`
    🚀 Servidor NewsScrapper activo (SECURE)
    🌍 URL: https://localhost:${PORT}
    📂 Sirviendo archivos desde: ${path.join(__dirname, 'public')}
    ✨ Scraping en tiempo real habilitado (On-Demand)
    `);
  });
} else {
  app.listen(PORT, () => {
    console.log(`
    🚀 Servidor NewsScrapper activo
    🌍 URL: http://localhost:${PORT}
    📂 Sirviendo archivos desde: ${path.join(__dirname, 'public')}
    ✨ Scraping en tiempo real habilitado (On-Demand)
    `);
  });
}
