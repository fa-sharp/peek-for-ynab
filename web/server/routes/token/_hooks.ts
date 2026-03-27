import type { FastifyInstance } from "fastify";

/** Hooks for the token API routes */
export default async function (app: FastifyInstance) {
  app.decorateRequest("token", null);

  // Decrypt the token from the Authorization header and attach it to the request
  app.addHook("preParsing", async (req, reply) => {
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
