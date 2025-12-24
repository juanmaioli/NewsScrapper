# 📰 NewsScrapper
https://juanmaioli.github.io/NewsScrapper/

Scraper desarrollado en **Node.js** que extrae noticias de diversos portales argentinos y las almacena en archivos JSON. El proyecto incluye un frontend básico para visualizar las noticias capturadas.

## 1. 🚀 Descripción
Este proyecto automatiza la recolección de artículos periodísticos utilizando bibliotecas como `cheerio` para el parseo de HTML y `puppeteer` (en dependencias) para navegaciones más complejas. Los datos extraídos incluyen titulares, resúmenes, imágenes y el cuerpo de la noticia.

## 2. 🛠️ Instalación
Para poner en marcha el proyecto localmente, asegúrate de tener **Node.js** instalado y ejecuta los siguientes comandos:

```bash
git clone https://github.com/juanmaioli/NewsScrapper.git
cd NewsScrapper
npm install
```

## 3. ▶️ Uso
El script principal ejecuta los scrapers de forma secuencial para cada medio configurado.

Para iniciar el proceso de scraping:

```bash
npm start
# O ejecutando directamente el archivo
node index.js
```

Los resultados se guardarán automáticamente en la carpeta `json/`.

## 4. 🗞️ Medios Soportados
Actualmente el sistema extrae información de los siguientes portales:

| Medio | Archivo Lógico | Salida JSON |
| :--- | :--- | :--- |
| **Infobae** | `medios/infobae.js` | `json/infobae.json` |
| **La Nación** | `medios/lanacion.js` | `json/lanacion.json` |
| **El Cronista** | `medios/cronista.js` | `json/cronista.json` |
| **Perfil** | `medios/perfil.js` | `json/perfil.json` |
| **Rio Negro** | `medios/rionegro.js` | `json/rionegro.json` |
| **LMNeuquen** | `medios/lmneuquen.js` | `json/lmneuquen.json` |

## 5. 📂 Estructura del Proyecto
*   **`index.js`**: Punto de entrada que orquesta la ejecución de los scrapers.
*   **`medios/`**: Contiene la lógica de scraping específica para cada sitio web.
*   **`json/`**: Directorio de destino para los datos estructurados extraídos.
*   **`img/`**: Recursos gráficos para el frontend y PWA.