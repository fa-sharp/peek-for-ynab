ARG NODE_VERSION=22
ARG NODE_MINOR_VERSION=23
ARG DEBIAN_VERSION=bookworm
ARG RUST_VERSION=1.96

### BUILD WEBSITE ###
FROM node:${NODE_VERSION}.${NODE_MINOR_VERSION}-slim AS build-web

WORKDIR /app/web
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

COPY --link web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
RUN corepack enable
RUN corepack prepare --activate

# Install all dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Build Astro app (copy shared fonts and styles from extension)
COPY --link web .
COPY --link extension/src/assets/fonts /app/extension/src/assets/fonts
COPY --link extension/src/styles /app/extension/src/styles
RUN --mount=type=cache,id=astro,target=/app/web/node_modules/.astro \
    pnpm run build


### BUILD SERVER ###
FROM rust:${RUST_VERSION}-slim-${DEBIAN_VERSION} AS build-server
WORKDIR /app

COPY ./server/Cargo.lock ./server/Cargo.toml ./
COPY ./server/src ./src

ARG pkg=peek-server

RUN --mount=type=cache,id=rust_target,target=/app/target \
    --mount=type=cache,id=cargo_registry,target=/usr/local/cargo/registry \
    --mount=type=cache,id=cargo_git,target=/usr/local/cargo/git \
    set -eux; \
    cargo build --package $pkg --release --locked; \
    objcopy --compress-debug-sections target/release/$pkg ./run-server


### RUN SERVER ###
FROM gcr.io/distroless/cc-debian12:nonroot AS run

# Copy server binary
COPY --from=build-server --chown=nonroot /app/run-server /app/server/run-server

# Copy website static files
COPY --from=build-web --chown=nonroot /app/web/dist /app/web/dist

# Run server
WORKDIR /app/server
ENV PEEK_HOST=0.0.0.0
CMD ["./run-server"]
