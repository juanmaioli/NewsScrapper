# 1. ETAPA DE CONSTRUCCIÓN (BUILD)
FROM node:22-alpine AS builder

# Instalar herramientas para módulos nativos (better-sqlite3)
RUN apk add --no-cache python3 make g++ build-base

RUN corepack enable && corepack prepare pnpm@11 --activate

# Autorizar específicamente las dependencias que necesitan compilar módulos nativos
ENV PNPM_ONLY_BUILT_DEPENDENCIES=better-sqlite3,puppeteer

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml* .npmrc* ./

# Instalar TODAS las dependencias (incluyendo las necesarias para compilar)
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Eliminar dependencias de desarrollo y limpiar caché
RUN pnpm prune --prod

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

# Ejecutar node directamente (más ligero que pnpm en producción)
CMD ["node", "server.js"]
