# Stage 1: Base (Dependencies)
FROM node:24-alpine as base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Builder (Production Build)
FROM base as builder
COPY . .
RUN npm run build

# Stage 2: Production Runner
FROM nginx:alpine

# Copy build artifacts to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config as a template. The entrypoint renders it to
# conf.d/default.conf so CARTO_API_KEY can be supplied at container start
# rather than baked into the published image.
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy Entrypoint Script
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Expose HTTP port
EXPOSE 80

# Start Nginx via Entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
