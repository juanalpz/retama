# imagen del backend, en dos etapas.

# etapa 1: instala todas las dependencias y compila typescript a javascript
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# etapa 2: imagen final, solo con las dependencias de ejecucion y el codigo compilado
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
