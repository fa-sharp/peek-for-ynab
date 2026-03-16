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
    // Calls cleanup function if Astro doesn't handle the request.
    // FIXME https://github.com/withastro/astro/pull/15735
    const nextWithCleanup = (err: unknown) => {
      for (const sym of Object.getOwnPropertySymbols(req.raw)) {
        // @ts-ignore
        const cleanup = req.raw[sym];
        if (typeof cleanup === "function") cleanup();
      }
      next(!err ? undefined : err instanceof Error ? err : new Error(String(err)));
    };

    const locals = isApiRequest(req.url)
      ? { log: req.log.child({ module: "api" }) }
      : undefined;
    opts.ssrHandler(req.raw, res.raw, nextWithCleanup, locals);
  });
});
