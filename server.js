import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8053;

// Inicialización de SQLite para caché
const db = new Database('cache.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS cache_status (
    medio_id TEXT PRIMARY KEY,
    last_update INTEGER
  )
`);

// Mapeo de medios a funciones de scrap
const scraperMap = {
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
  'tn.json': { name: 'TN', fn: tnScrap }
};

// Estado de scraping activo
const activeScrapes = new Set();

// Endpoint para disparar el scraping on-demand (Asíncrono con Caché SQLite)
app.get('/api/scrap/:medio', (req, res) => {
  const medioId = req.params.medio;
  const scraper = scraperMap[medioId];
  const TTL_MINUTES = 30;
  const now = Math.floor(Date.now() / 1000);

  if (!scraper) {
    return res.status(404).json({ error: 'Medio no encontrado' });
  }

  // Verificar Caché en SQLite
  const row = db.prepare('SELECT last_update FROM cache_status WHERE medio_id = ?').get(medioId);
  
  if (row && (now - row.last_update) < (TTL_MINUTES * 60)) {
    const timeRemaining = Math.ceil(((TTL_MINUTES * 60) - (now - row.last_update)) / 60);
    console.log(`ℹ️ [Cache] Datos frescos para ${scraper.name}. Faltan ${timeRemaining} min para el próximo scrap.`);
    return res.json({ 
      success: true, 
      message: `El caché de ${scraper.name} es reciente. Próxima actualización en ${timeRemaining} minutos.`,
      status: 'cached'
    });
  }

  if (activeScrapes.has(medioId)) {
    return res.json({ success: true, message: `La actualización de ${scraper.name} ya está en curso.`, status: 'processing' });
  }

  // Iniciamos el proceso en "segundo plano"
  activeScrapes.add(medioId);
  console.log(`⏳ [Background] Iniciando actualización para: ${scraper.name}`);

  scraper.fn(20)
    .then(() => {
      console.log(`✅ [Background] Actualización completada para: ${scraper.name}`);
      // Actualizar timestamp en SQLite
      db.prepare('INSERT OR REPLACE INTO cache_status (medio_id, last_update) VALUES (?, ?)').run(medioId, Math.floor(Date.now() / 1000));
    })
    .catch((error) => {
      console.error(`❌ [Background] Error al actualizar ${scraper.name}:`, error);
    })
    .finally(() => {
      activeScrapes.delete(medioId);
    });

  // Respondemos inmediatamente al cliente
  res.json({ 
    success: true, 
    message: `Iniciando actualización de ${scraper.name}. Los datos estarán listos en unos segundos.`,
    status: 'started'
  });
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
    ✨ Actualización asíncrona habilitada (Cache TTL: 30m)
    `);
  });
} else {
  app.listen(PORT, () => {
    console.log(`
    🚀 Servidor NewsScrapper activo
    🌍 URL: http://localhost:${PORT}
    📂 Sirviendo archivos desde: ${path.join(__dirname, 'public')}
    ✨ Actualización asíncrona habilitada (Cache TTL: 30m)
    `);
  });
}
