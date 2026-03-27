import fastifyHelmet from "@fastify/helmet";
import fastifyPlugin from "fastify-plugin";

/** Add security headers to all requests */
export default fastifyPlugin(async (app) => {
  app.register(fastifyHelmet, {
    contentSecurityPolicy: false, // CSP added by Astro to HTML pages
  });
});
