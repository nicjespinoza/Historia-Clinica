# ============================================================
# NOTA IMPORTANTE:
# ============================================================
# Este proyecto usa Firebase como backend, NO un servidor Node.js tradicional.
# El Dockerfile original fue creado para una arquitectura que ya no se usa.
#
# Para desarrollo: npm run dev
# Para producción: firebase deploy
#
# Si necesitas containerizar para algún propósito específico,
# el archivo Dockerfile.firebase-emulators está disponible para
# ejecutar emuladores de Firebase localmente.
# ============================================================

# Stage 1: Build Frontend for Firebase Hosting
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx (para pruebas locales sin Firebase)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf 2>/dev/null || true
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
