# ==============================================================================
# MetaGaming Multi-Stage Dockerfile
# Targets: server, client
# ==============================================================================

# Base image with Node.js
FROM node:22-alpine AS base
WORKDIR /app

# ------------------------------------------------------------------------------
# Target: server
# ------------------------------------------------------------------------------
FROM base AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

FROM node:22-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server-builder /app/server/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]

# ------------------------------------------------------------------------------
# Target: client
# ------------------------------------------------------------------------------
FROM base AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM nginx:alpine AS client
COPY --from=client-builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
