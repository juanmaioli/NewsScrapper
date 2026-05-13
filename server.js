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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8053;

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
  'elpais.json': { name: 'El País Argentina', fn: elpaisScrap },
  'googlenews.json': { name: 'Google News', fn: googlenewsScrap }
};

// Estado de scraping activo
const activeScrapes = new Set();

// Endpoint para disparar el scraping on-demand (Asíncrono)
app.get('/api/scrap/:medio', (req, res) => {
  const medioId = req.params.medio;
  const scraper = scraperMap[medioId];

  if (!scraper) {
    return res.status(404).json({ error: 'Medio no encontrado' });
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
    ✨ Actualización asíncrona habilitada
    `);
  });
} else {
  app.listen(PORT, () => {
    console.log(`
    🚀 Servidor NewsScrapper activo
    🌍 URL: http://localhost:${PORT}
    📂 Sirviendo archivos desde: ${path.join(__dirname, 'public')}
    ✨ Actualización asíncrona habilitada
    `);
  });
}
