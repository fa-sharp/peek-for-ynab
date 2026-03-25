import fastifyStatic from "@fastify/static";
import fastifyPlugin from "fastify-plugin";

import { isApiRequest } from "../lib.ts";

/** Serves the Astro website */
export default fastifyPlugin<{
  rootStaticPath: string;
  ssrHandler: (...args: unknown[]) => void | Promise<void>;
}>(async (app, opts) => {
  // Serve Astro static files
  app.register(fastifyStatic, {
    root: opts.rootStaticPath,
    cacheControl: false,
    setHeaders: (res, path) => {
      if (path.startsWith(`${opts.rootStaticPath}/_astro/`)) {
        res.setHeader("cache-control", "public, max-age=31536000, immutable");
      }
    },
  });

  // Astro SSR / API handler with logging
  // TODO this should be removed after auth migration
  app.addHook("onRequest", (req, res, next) => {
    const locals = isApiRequest(req.url)
      ? { log: req.log.child({ module: "api" }) }
      : undefined;
    opts.ssrHandler(req.raw, res.raw, next, locals);
  });
});
