# Plan de Mejora y Corrección - NewsScrapper

El error "Failed to fetch" ocurre cuando la conexión entre el navegador y el servidor se interrumpe, generalmente por un timeout debido a que el proceso de scraping (especialmente con Puppeteer para 20 noticias) demora demasiado.

## 1. 🏗️ Refactorización de la API (Asíncrona)
- Modificar `server.js` para que el endpoint `/api/scrap/:medio` responda inmediatamente que la tarea ha comenzado.
- Ejecutar el scraping en segundo plano para evitar bloquear la conexión HTTP.
- Implementar un sistema básico de estado para saber si un medio se está actualizando.

## 2. 🎨 Mejora del Frontend
- Actualizar `index.html` para manejar la respuesta asíncrona.
- Implementar un reintento o una espera inteligente antes de cargar el JSON actualizado.

## 3. 🐛 Corrección de Scrapers
- **Google News:** Actualizar los selectores de Puppeteer/Cheerio ya que parece no detectar noticias.
- **Cronista:** Verificar por qué el archivo JSON queda en 0 bytes.
- **Optimización General:** Reducir el número de noticias por defecto o hacer que sea configurable.

## 4. 🔒 Soporte HTTPS (Opcional pero recomendado)
- Configurar `server.js` para usar los certificados en `/ssl` si están presentes, evitando problemas de "Mixed Content" o bloqueos de seguridad.

## 5. 🧪 Verificación
- Probar cada medio individualmente.
- Asegurar que no haya fugas de memoria con Puppeteer (asegurar el cierre de instancias).
