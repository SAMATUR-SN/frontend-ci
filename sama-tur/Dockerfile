# Étape 1 : construction de l'application (fichiers statiques)
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --retry 5 --fetch-retries 5 --fetch-timeout 300000

COPY . .
RUN npx ng build

# Étape 2 : nginx sans privilèges (utilisateur non root, port 8080)
FROM nginxinc/nginx-unprivileged:alpine
USER root
RUN apk upgrade --no-cache
USER 101

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/sama-tur/browser /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health || exit 1
