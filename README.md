# 📰 NewsScrapper

¡Bienvenido a **NewsScrapper**! Una herramienta potente y moderna para el scraping de noticias de los principales medios de Argentina.

## 🚀 Características

- 🕷️ **Scraping On-Demand:** Actualización dinámica de noticias al cambiar de medio en la web.
- ⚡ **Arquitectura Asíncrona:** El scraping se ejecuta en segundo plano para una experiencia de usuario fluida sin bloqueos.
- 📱 **Interfaz Moderna:** Visualizador web basado en **Bootstrap 5.3** con modo oscuro y diseño responsive.
- 🔒 **Seguridad Mejorada:** Soporte para **HTTPS** (SSL) y protección de archivos del sistema.
- 🇦🇷 **Medios Soportados:** Infobae, La Nación, El Cronista, Google News, LMN, Río Negro, Perfil, CNN y más.

## 🛠️ Instalación

1. Clona este repositorio.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor:
   ```bash
   npm start
   ```

## 🌐 Uso

Accede a la aplicación a través de:
- **HTTP:** `http://localhost:8053`
- **HTTPS:** `https://localhost:8053` (Si los certificados en `/ssl` están configurados)

Simplemente selecciona un medio en el menú desplegable y el sistema se encargará de buscar las últimas noticias automáticamente.

## 📂 Estructura del Proyecto

- `server.js`: Núcleo del servidor Express (Scraping + Web).
- `/medios`: Lógica modular de scraping para cada diario.
- `/public`: Frontend estático y almacenamiento de datos JSON.
- `/ssl`: Certificados de seguridad.

---
Desarrollado con ❤️ por **Juan Gabriel Maioli**.
