# 📰 NewsScrapper

¡Bienvenido a **NewsScrapper**! 🚀 Una herramienta potente y moderna para el scraping de noticias de los principales medios de Argentina, optimizada para la velocidad, la seguridad y la facilidad de uso.

<p align="center">
  <img src="public/img/No-Image-Placeholder.svg" alt="NewsScrapper Logo" width="200">
</p>

---

## ✨ Características Destacadas

- 🕷️ **Scraping On-Demand:** Actualización dinámica de noticias en tiempo real al cambiar de medio en la interfaz web.
- 🗄️ **Caché Inteligente (SQLite):** Implementación de un sistema de caché con **TTL de 30 minutos**. Ahorra recursos y evita el scraping redundante.
- ⚡ **Arquitectura Asíncrona:** El proceso de recolección de datos se ejecuta en segundo plano, garantizando una navegación fluida.
- 📱 **Interfaz Premium:** Visualizador web basado en **Bootstrap 5.3** con soporte nativo para **Modo Oscuro** y diseño 100% responsive.
- 🔒 **Seguridad de Grado Bancario:** Soporte para **HTTPS (SSL)** y aislamiento de archivos sensibles del sistema.
- 🇦🇷 **Cobertura Federal:** Scraping optimizado para Infobae, La Nación, El Cronista, Google News, LMN, Río Negro, Perfil, CNN y más.

---

## 🛠️ Instalación y Configuración

Sigue estos pasos para poner en marcha tu propia instancia de NewsScrapper:

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

---

## 🌐 Guía de Uso

Una vez iniciado el servidor, puedes acceder a la aplicación en:

- 🟢 **HTTP:** [http://localhost:8053](http://localhost:8053)
- 🔵 **HTTPS:** [https://localhost:8053](https://localhost:8053) *(Requiere configuración previa en `/ssl`)*

**¿Cómo funciona?**
Simplemente selecciona tu medio preferido en el menú desplegable. El sistema detectará automáticamente si los datos están frescos o si necesita realizar un nuevo scraping, manteniéndote siempre informado con el mínimo delay.

---

## 📂 Organización del Proyecto

El código está organizado de forma modular para facilitar su mantenimiento:

- 📂 `server.js`: Núcleo del servidor Express (Gestión de Scraping + Servidor Web).
- 📂 `/medios`: Módulos especializados de scraping para cada diario argentino.
- 📂 `/public`: Frontend estático, recursos visuales y almacenamiento de datos JSON.
- 📂 `/ssl`: Directorio para certificados de seguridad.

---

## 🤝 Contribuciones

Si deseas mejorar los scrapers existentes o añadir nuevos medios, ¡tus aportes son bienvenidos!

---

<p align="center">
  Desarrollado con 💙 por <b>Juan Gabriel Maioli</b>
</p>
