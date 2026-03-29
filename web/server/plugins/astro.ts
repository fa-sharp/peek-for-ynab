import fastifyStatic from "@fastify/static";
import fastifyPlugin from "fastify-plugin";

/** Serves the Astro website static files */
export default fastifyPlugin<{ rootStaticPath: string }>(async (app, opts) => {
  app.register(fastifyStatic, {
    root: opts.rootStaticPath,
    cacheControl: false,
    setHeaders: (res, path) => {
      if (path.startsWith(`${opts.rootStaticPath}/_astro/`)) {
        res.setHeader("cache-control", "public, max-age=31536000, immutable");
      }
    },
  });
});
