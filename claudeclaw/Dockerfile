# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json tsup.config.ts ./
COPY src/ src/
COPY bin/ bin/
COPY skills/ skills/
COPY web/ web/

RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine
RUN apk add --no-cache tini

# Non-root user
RUN addgroup -S claw && adduser -S claw -G claw
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist/ dist/
COPY --from=builder /app/web/ web/
COPY --from=builder /app/skills/ skills/

RUN mkdir -p /data && chown claw:claw /data
ENV CLAW_DATA_DIR=/data
ENV NODE_ENV=production

USER claw
EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3100/health || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/bin/claw.js", "serve", "web"]
