import cors from "cors";
import type { FastifyPluginCallback } from "fastify";
import fastifyPlugin from "fastify-plugin";

import { isApiRequest } from "../lib.ts";

/**
 * Add CORS middleware to all API requests.
 */
const corsPlugin: FastifyPluginCallback<{ allowedOrigins?: string[] }> = async (
  app,
  opts
) => {
  const corsMiddleware = cors({
    origin: !opts.allowedOrigins
      ? "*"
      : (origin, cb) => cb(null, origin && opts.allowedOrigins?.includes(origin)),
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "HEAD", "POST", "OPTIONS"],
  });

  app.addHook("onRequest", (req, res, next) => {
    if (isApiRequest(req.url)) {
      corsMiddleware(req, res.raw, next);
    } else {
      next();
    }
  });
};

export default fastifyPlugin(corsPlugin);
