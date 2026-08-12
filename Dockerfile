# ── Stage 1: build the web app ──────────────────────────────────────────────
FROM node:22-alpine AS web-build
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ── Stage 2: install server production deps ─────────────────────────────────
FROM node:22-alpine AS server-deps
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 3: runtime ────────────────────────────────────────────────────────
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=server-deps /app/node_modules ./node_modules
COPY server/package.json ./
COPY server/src ./src
COPY knowledge ./knowledge
COPY --from=web-build /web/dist ./public
EXPOSE 8790
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-8790}/api/health || exit 1
CMD ["node", "src/index.js"]
