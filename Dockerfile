ARG NODE_VERSION=22
ARG NODE_MINOR_VERSION=22

### Base build image ###
FROM node:${NODE_VERSION}.${NODE_MINOR_VERSION}-slim AS base

WORKDIR /app/web
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

COPY --link web/package.json web/pnpm-lock.yaml ./
RUN corepack enable
RUN corepack prepare --activate

### BUILDER ###
FROM base AS builder

# Install all dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Build Astro app (copy shared fonts and styles from extension)
COPY --link web .
COPY --link extension/src/assets/fonts /app/extension/src/assets/fonts
COPY --link extension/src/styles /app/extension/src/styles
RUN --mount=type=cache,id=astro,target=/app/web/node_modules/.astro \
    pnpm run build

### PROD INSTALLER ###
FROM base AS installer

# Install prod dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile

### RUNNER ###
FROM gcr.io/distroless/nodejs${NODE_VERSION}-debian12 AS runner
WORKDIR /app

# Copy built application and prod dependencies
COPY --from=builder /app/web/dist ./dist
COPY --from=builder /app/web/server ./server
COPY --from=installer /app/web/node_modules ./node_modules
COPY --from=installer /app/web/package.json ./package.json

ENV NODE_ENV=production
ENV HOST="0.0.0.0"
CMD ["server/index.ts"]
