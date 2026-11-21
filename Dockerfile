# Production image for the Coolify "Docker Image" app. Built in GitHub Actions (.github/workflows/deploy.yml);
# the server only pulls. Weaviate and MongoDB run as separate Coolify resources.
FROM node:24-bookworm-slim

# curl only for the health check (cheaper than a new Node process per check).
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production PORT=3000
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --start-interval=1s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/health || exit 1
CMD ["node", "server.js"]
