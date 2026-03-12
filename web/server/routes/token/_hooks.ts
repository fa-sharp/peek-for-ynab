import type { FastifyInstance } from "fastify";

/** Hook for decrypting the tokens from the Authorization header */
export default async function (app: FastifyInstance) {
  app.decorateRequest("token", null);

  app.addHook("onRequest", async (req, reply) => {
    const authToken = req.headers["authorization"];
    if (!authToken) {
      return reply.status(401).send({ message: "Unauthorized" });
    }

    try {
      const decryptedToken = app.crypto.decryptTokenData(authToken);
      req.token = decryptedToken;
    } catch (err) {
      req.log.info({ err }, "Invalid token");
      return reply.status(401).send({ message: "Unauthorized" });
    }
  });
}
