# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.17
FROM node:${NODE_VERSION}-slim AS builder

LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install node modules
COPY --link package.json pnpm-lock.yaml ./
RUN corepack enable
RUN corepack prepare --activate
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build Next.js app
COPY --link . .
ENV NODE_ENV=production
ARG WEBSITE_DOMAIN=""
RUN --mount=type=cache,id=next,target=/app/.next/cache pnpm run build:next

# Final stage for app image
FROM gcr.io/distroless/nodejs20-debian12 AS runner

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
CMD ["server.js"]
