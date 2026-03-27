import fastifyRateLimit from "@fastify/rate-limit";
import fastifyPlugin from "fastify-plugin";
import Redis from "ioredis";

export default fastifyPlugin<{ redisUrl?: string }>(async (app, opts) => {
  // Connect to Redis if a URL is provided
  const redis = opts.redisUrl
    ? new Redis(opts.redisUrl, {
        connectionName: "peek",
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
      })
    : null;
  redis?.on("ready", () => {
    app.log.info(opts, "Connected to Redis");
  });
  redis?.on("error", (err) => {
    app.log.error({ err }, "Redis error");
  });

  // Setup rate limiting
  await app.register(fastifyRateLimit, {
    global: false, // must be applied individually per route
    nameSpace: "peek:ratelimit:",
    redis,
  });

  // Rate limit the 404 handler
  app.setNotFoundHandler(
    {
      preHandler: app.rateLimit({
        max: 100,
        timeWindow: "1 minute",
      }),
    },
    function (_, reply) {
      reply.code(404).send({ message: "Not found" });
    }
  );

  app.addHook("onClose", async () => {
    redis?.removeAllListeners();
    await redis?.quit();
  });
});
