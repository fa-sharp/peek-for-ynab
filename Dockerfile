# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.17
FROM node:${NODE_VERSION}-slim as builder

LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
ARG PNPM_VERSION=9.1.1
RUN npm install -g pnpm@$PNPM_VERSION

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY --link package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build Next.js app
COPY --link . .
RUN pnpm run build:next

# Final stage for app image
FROM gcr.io/distroless/nodejs20-debian12:nonroot as runner

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

EXPOSE 3000
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
CMD ["server.js"]
