# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.17
FROM node:${NODE_VERSION}-slim as builder

LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack prepare --activate

# Install node modules
COPY --link package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build Next.js app
COPY --link . .
ENV NODE_ENV=production
ARG WEBSITE_DOMAIN=""
RUN --mount=type=cache,id=next,target=/app/.next/cache pnpm run build:next

# Final stage for app image
FROM gcr.io/distroless/nodejs20-debian12 as runner

# Copy built application
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
CMD ["server.js"]
