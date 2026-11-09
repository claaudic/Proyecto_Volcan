# Tienda React lista para la nube (la levanta el docker-compose del backend).
#
# Paso 1: Node arma la pagina (npm run build -> carpeta dist).
# Paso 2: nginx la muestra en el puerto 80 y pasa /api al Gateway.
# La imagen final solo lleva nginx y la carpeta dist (sin Node ni node_modules).

FROM node:24-alpine AS armar
WORKDIR /app

# Primero solo las dependencias: si no cambian, Docker reutiliza esta capa
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# React llama a la API en la misma direccion de la pagina (/api/v1),
# asi no queda escrita la IP de la EC2, que cambia al reiniciar
ENV VITE_API_URL=/api/v1
RUN npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=armar /app/dist /usr/share/nginx/html
EXPOSE 80
