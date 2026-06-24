# ── Stage 1: build the React client ──────────────────────────────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install --legacy-peer-deps
COPY client/ ./
RUN npm run build

# ── Stage 2: server runtime, serving the built client ────────────────────────
# Debian-based (not alpine) — onnxruntime-node's native binding requires glibc.
FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 5001
CMD ["sh", "-c", "node server/config/syncDb.js && node server/server.js"]
