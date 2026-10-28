# Stage 1: Build the Vite React application
FROM node:22-alpine AS builder

WORKDIR /app

# Cache dependency layer using package lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files and compile static production build
COPY . .
RUN npm run build

# Stage 2: Serve production bundle with unprivileged Nginx
FROM nginxinc/nginx-unprivileged:1.27-alpine

ENV PORT=8080
ENV NGINX_ENVSUBST_FILTER="PORT"

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx server configuration template with dynamic $PORT support
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
