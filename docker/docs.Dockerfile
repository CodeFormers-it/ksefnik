# ── Stage 1: Install dependencies ──
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/docs/package.json apps/docs/
RUN pnpm install --frozen-lockfile --filter @ksefnik/docs...

# ── Stage 2: Build static site ──
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate
RUN apk add --no-cache bash git
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/docs/node_modules ./apps/docs/node_modules

COPY pnpm-workspace.yaml package.json ./
COPY apps/docs/ apps/docs/

# Pro docs: clone ksefnik-pro if token is provided
ARG PRO_REPO_TOKEN
RUN if [ -n "$PRO_REPO_TOKEN" ]; then \
      echo "Fetching pro docs..." && \
      git clone --depth 1 "https://x:${PRO_REPO_TOKEN}@github.com/CodeFormers-it/ksefnik-pro.git" /tmp/ksefnik-pro && \
      if [ -d /tmp/ksefnik-pro/docs/content ]; then \
        cp -r /tmp/ksefnik-pro/docs/content/* apps/docs/src/content/docs/ ; \
      fi && \
      rm -rf /tmp/ksefnik-pro ; \
    else \
      echo "No PRO_REPO_TOKEN — building public docs only" ; \
    fi

RUN pnpm --filter @ksefnik/docs run build:public

# ── Stage 3: Serve with nginx ──
FROM nginx:alpine

COPY docker/nginx-docs.conf /etc/nginx/nginx.conf
COPY --from=builder /app/apps/docs/dist /usr/share/nginx/html

EXPOSE 80

LABEL org.opencontainers.image.source=https://github.com/CodeFormers-it/ksefnik
