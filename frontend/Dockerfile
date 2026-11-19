# imagen del frontend, en dos etapas.

# etapa 1: instala las dependencias y compila la app con vite
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# la url de la api queda fija al compilar. con /api el navegador le habla al
# mismo servidor que sirve el front, y nginx reenvia esos pedidos al backend.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# etapa 2: nginx sirve los archivos compilados
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
