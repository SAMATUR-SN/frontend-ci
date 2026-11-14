# Construction Angular SSR
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --retry 5 --fetch-retries 5 --fetch-timeout 300000

COPY . .
RUN npm run build

# Image de production
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist/sama-tur ./dist/sama-tur

EXPOSE 4000

CMD ["node", "dist/sama-tur/server/server.mjs"]
