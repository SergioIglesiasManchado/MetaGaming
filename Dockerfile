# ==============================================================================
# MetaGaming Multi-Stage Dockerfile
# Targets: server, client
# ==============================================================================

# Base image with Node.js (Debian glibc to ensure binary compatibility with npm lockfile)
FROM node:22-slim AS base
WORKDIR /app

# ------------------------------------------------------------------------------
# Target: server
# ------------------------------------------------------------------------------
FROM base AS server-builder
WORKDIR /app
COPY package*.json ./
COPY server/package.json ./server/
RUN npm ci --workspace=server --include-workspace-root
COPY server/ ./server/
RUN npm --workspace=server run build

FROM node:22-slim AS server
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY server/package.json ./server/
RUN npm ci --omit=dev --workspace=server --include-workspace-root
COPY --from=server-builder /app/server/dist ./server/dist
EXPOSE 3000
CMD ["node", "server/dist/index.js"]

# ------------------------------------------------------------------------------
# Target: client
# ------------------------------------------------------------------------------
FROM base AS client-builder
WORKDIR /app
COPY package*.json ./
COPY client/package.json ./client/
RUN npm ci --workspace=client --include-workspace-root
COPY client/ ./client/
RUN npm --workspace=client run build

FROM nginx:alpine AS client
COPY --from=client-builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
