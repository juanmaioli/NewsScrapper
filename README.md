# 📰 NewsScrapper

¡Bienvenido a **NewsScrapper**! 🚀 Una herramienta potente y moderna para el scraping de noticias de los principales medios de Argentina, optimizada para la velocidad, la seguridad y la facilidad de uso.

<p align="center">
  <img src="public/img/No-Image-Placeholder.svg" alt="NewsScrapper Logo" width="200">
</p>

---

## ✨ Características Destacadas

- 🕷️ **Scraping On-Demand:** Actualización dinámica de noticias en tiempo real para más de 15 medios nacionales e internacionales.
- 🔊 **Lectura Inmersiva (TTS):** Escucha noticias en un modal a pantalla completa con resaltado tipo karaoke y cierre automático.
- 🎙️ **Personalización de Voz:** Selector dinámico de voces, control de velocidad y tono directamente desde la interfaz principal.
- ⚡ **Tiempo Real On-Demand:** Sistema síncrono que realiza el scraping del medio seleccionado de manera inmediata en cada cambio, asegurando la frescura absoluta de las noticias.
- 🚫 **Cero Caché (Doble Factor):** Deshabilitación estricta de caché del navegador mediante cabeceras HTTP en el servidor Express (`Cache-Control: no-store`) y etiquetas meta en el `<head>` del HTML.
- 📱 **Interfaz Premium Compacta:** Visualizador web basado en **Bootstrap 5.3** con soporte nativo de **Modo Oscuro**, optimización de contraste en footer de noticias, y un **panel de control horizontal unificado** de fácil lectura que integra volumen, selector de medios y tema en el header.
- 🐳 **Optimización Docker Extrema:** Dockerfile multi-etapa optimizado sin compiladores nativos de C++ (remoción de `better-sqlite3`), logrando un peso mínimo de la imagen y una velocidad de compilación superior.
- 🔒 **Seguridad de Grado Bancario:** Soporte para **HTTPS (SSL)**, aislamiento de archivos sensibles y ejecución en entornos aislados.
- 🇦🇷 Cobertura Federal, Militar e Internacional: Scraping optimizado para Infobae, La Nación, Clarín, Crónica, El Cronista, Google News, LMN, Río Negro, Mejor Informado, Noticias NQN, Perfil, TN, Argentina Gob (Noticias), CNN en Español, El País, The Hear (España), Infodefensa, Galaxia Militar y Zona Militar.
- 🧬 Robustez con JSON-LD y Selectores Precisos: Los scrapers extraen metadatos directamente de etiquetas estructuradas del estándar Schema.org o mediante selectores semánticos ultra-precisos validados.

---

## 🛠️ Instalación y Configuración

Sigue estos pasos para poner en marcha tu propia instancia de NewsScrapper:

### Opción 1: Ejecución Local
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/juanmaioli/NewsScrapper.git
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Iniciar el servidor:**
   ```bash
   npm start
   ```

### Opción 2: Docker (Recomendado) 🐳
Si preferís usar Docker para una experiencia más aislada y segura, simplemente ejecutá:

```bash
docker compose up -d --build
```
Esto levantará el servicio en el puerto **8053**, configurando automáticamente el entorno de Puppeteer y Chromium sin que tengas que instalar nada más en tu sistema.

---

## 🌐 Guía de Uso

Una vez iniciado el servidor, puedes acceder a la aplicación en:

- 🟢 **HTTP:** [http://localhost:8053](http://localhost:8053)
- 🔵 **HTTPS:** [https://localhost:8053](https://localhost:8053) *(Requiere configuración previa en `/ssl`)*

**¿Cómo funciona?**
Simplemente seleccioná tu medio preferido en el menú desplegable. El visualizador mostrará un spinner de carga dinámico mientras el servidor realiza la extracción síncrona en tiempo real del portal correspondiente. Una vez finalizada (toma unos pocos segundos), los datos se cargan de inmediato libres de cualquier almacenamiento local en caché.

---

## 📂 Organización del Proyecto

El código está organizado de forma modular para facilitar su mantenimiento:

- 📂 `server.js`: Núcleo del servidor Express (Gestión de Scraping + Servidor Web).
- 📂 `/medios`: Módulos especializados de scraping para cada diario argentino.
- 📂 `/public`: Frontend estático, recursos visuales y almacenamiento de datos JSON (directorio `/json` excluido de Git para optimizar commits).
- 📂 `/ssl`: Directorio para certificados de seguridad.

---

## 🤝 Contribuciones

Si deseas mejorar los scrapers existentes o añadir nuevos medios, ¡tus aportes son bienvenidos!

---

<p align="center">
  Desarrollado con 💙 por <b>Juan Gabriel Maioli</b>
</p>
