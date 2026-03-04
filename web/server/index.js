//@ts-check
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import cors from "cors";
import fastify from "fastify";

import { handler as ssrHandler } from "../dist/server/entry.mjs";

const prettyLog = {
  target: "pino-pretty",
  options: {
    colorize: true,
  },
};

// Fastify server
const app = fastify({
  disableRequestLogging: (req) => !isApiRequest(req.url),
  requestIdHeader: process.env.REQUEST_ID_HEADER,
  trustProxy: process.env.TRUST_PROXY === "true",
  logger: {
    transport: process.env.NODE_ENV === "development" ? prettyLog : undefined,
  },
});

// Astro static files
const rootStaticPath = fileURLToPath(new URL("../dist/client", import.meta.url));
app.register(fastifyStatic, {
  root: rootStaticPath,
  cacheControl: false,
  setHeaders: (res, path) => {
    if (path.startsWith(`${rootStaticPath}/_astro/`)) {
      res.setHeader("Cache-Control", "public,max-age=31536000,immutable");
    }
  },
});

// CORS handler for API requests
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",");
const corsMiddleware = cors({
  origin: !ALLOWED_ORIGINS
    ? "*"
    : (origin, cb) => {
        cb(null, !!(origin && ALLOWED_ORIGINS.includes(origin)));
      },
  allowedHeaders: ["Content-Type"],
  methods: ["GET", "HEAD", "POST", "OPTIONS"],
});
app.addHook("onRequest", (req, res, next) => {
  if (isApiRequest(req.url)) {
    corsMiddleware(req, res.raw, next);
  } else {
    next();
  }
});

/// Astro SSR / API handler with logging
app.addHook("onRequest", (req, res, next) => {
  // Calls cleanup function if Astro doesn't handle the request.
  // FIXME https://github.com/withastro/astro/pull/15735
  const nextWithCleanup = (/** @type {any} */ err) => {
    for (const sym of Object.getOwnPropertySymbols(req.raw)) {
      // @ts-ignore
      const cleanup = req.raw[sym];
      if (typeof cleanup === "function") cleanup();
    }
    next(err);
  };

  const locals = isApiRequest(req.url)
    ? { log: req.log.child({ module: "api" }) }
    : undefined;
  ssrHandler(req.raw, res.raw, nextWithCleanup, locals);
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

// Start the server
await app.listen({ host: process.env.HOST, port: +(process.env.PORT || 4321) });

/**
 * Whether the request URL indicates an API request.
 * @param {string} url
 */
function isApiRequest(url) {
  return url.startsWith("/api/");
}
