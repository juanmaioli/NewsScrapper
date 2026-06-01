# 1. ETAPA DE CONSTRUCCIÓN (BUILD)
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias (solo los de npm)
COPY package.json ./

# Instalar dependencias con npm (maneja mejor la compilación nativa en Docker)
RUN npm install

# Copiar código fuente
COPY . .

# 2. ETAPA DE PRODUCCIÓN (FINAL)
FROM node:22-alpine

# Instalar Chromium y dependencias mínimas para Puppeteer en Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Variables de entorno para que Puppeteer use el Chromium del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

WORKDIR /app

# Copiar solo lo necesario desde la etapa de construcción
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/medios ./medios
COPY --from=builder /app/public ./public

# Configurar permisos para el usuario 'node'
RUN chown -R node:node /app

# Cambiar a usuario no privilegiado
USER node

EXPOSE 8053

# Ejecutar node directamente
CMD ["node", "server.js"]
