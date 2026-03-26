import { fileURLToPath } from "node:url";
import fastifyAutoload from "@fastify/autoload";
import fastifyEnv from "@fastify/env";
import fastify from "fastify";
import { Type as T } from "typebox";

import { isApiRequest } from "./lib.ts";
import { astro, cors, crypto, helmet, oauth, rateLimit } from "./plugins/index.ts";

/** Environment variables */
export const envSchema = T.Object({
  ALLOWED_ORIGINS: T.Optional(T.String({ description: "Comma-separated list" })),
  TOKEN_KEY: T.String({ minLength: 64, maxLength: 64, pattern: "^[a-fA-F0-9]+$" }),
  YNAB_CLIENT_ID: T.String(),
  YNAB_SECRET: T.String(),
  YNAB_BASE_URL: T.String({ default: "https://app.ynab.com" }),
  REDIS_URL: T.Optional(T.String()),
});

/**
 * Create the Fastify server that handles OAuth token fetching, refresh, and encryption,
 * and serves the Astro static website.
 */
export async function createServer() {
  const app = fastify({
    disableRequestLogging: (req) => !isApiRequest(req.url),
    requestIdHeader: process.env.REQUEST_ID_HEADER,
    trustProxy: process.env.TRUST_PROXY === "true",
    forceCloseConnections: true,
    routerOptions: {
      ignoreTrailingSlash: true,
    },
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport:
        process.env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    },
  });

  // Parse and verify config / env variables
  await app.register(fastifyEnv, {
    dotenv: process.env.NODE_ENV !== "production" && {
      quiet: true,
    },
    schema: envSchema,
  });

  // Setup rate limit
  await app.register(rateLimit, { redisUrl: app.config.REDIS_URL });

  // OAuth login and callback
  app.register(oauth, {
    prefix: "/api/auth/v2",
    baseUrl: app.config.YNAB_BASE_URL,
    clientId: app.config.YNAB_CLIENT_ID,
    clientSecret: app.config.YNAB_SECRET,
  });

  // Token encryption
  app.register(crypto, {
    keys: [Buffer.from(app.config.TOKEN_KEY, "hex")],
  });

  // Security headers
  app.register(helmet);

  // CORS middleware for API requests
  app.register(cors, {
    allowedOrigins: app.config.ALLOWED_ORIGINS?.split(","),
  });

  // Astro website
  app.register(astro, {
    rootStaticPath: fileURLToPath(new URL("../dist/client", import.meta.url)),
    ssrHandler: (await import("../dist/server/entry.mjs")).handler,
  });

  // API routes
  await app.register(fastifyAutoload, {
    dir: fileURLToPath(new URL("routes", import.meta.url)),
    options: { prefix: "/api" },
    forceESM: true,
    autoHooks: true,
    autoHooksPattern: /^[_.]?hooks(?:\.js|\.ts)$/i,
  });

  // Shutdown handler
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal} signal. Shutting down...`);
      try {
        await app.close();
        process.exit(0);
      } catch (err) {
        app.log.error({ err }, "Error while closing server");
        process.exit(1);
      }
    });
  }

  return app;
}
