// https://docs.astro.build/en/guides/middleware/#middleware-types
// biome-ignore lint/style/noNamespace: this is Astro's recommended way of declaring locals
declare namespace App {
  interface Locals {
    log: import("fastify").FastifyBaseLogger;
  }
}
