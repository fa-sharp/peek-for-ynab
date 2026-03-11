import type { FastifyInstance } from "fastify";

/**
 * Token API routes for the browser extension
 */
export default async function tokenRoutes(app: FastifyInstance) {
  app.post("/", async (req, reply) => {
    if (!req.token) throw new Error("Expected token on request");

    // Refresh the token if it's expired or expires in less than 5 minutes,
    // and return the updated access token along with the encrypted auth token.
    if (new Date(req.token.expires_at).getTime() < Date.now() + 5 * 60 * 1000) {
      try {
        req.log.info("Refreshing token");
        const { token } = await app.oauth.getNewAccessTokenUsingRefreshToken(
          req.token,
          {}
        );
        return {
          token: token.access_token,
          authToken: app.crypto.encryptTokenData(token),
        };
      } catch (err) {
        req.log.warn({ err }, "Failed to refresh token");
        return reply.status(401).send({ message: "Unauthorized" });
      }
    }

    return { token: req.token.access_token };
  });

  app.post("/logout", async (req, reply) => {
    if (!req.token) throw new Error("Expected token on request");

    try {
      await app.oauth.revokeToken(req.token, "refresh_token", undefined);
    } catch (err) {
      req.log.warn({ err }, "Failed to revoke token");
    }

    return reply.status(204).send();
  });
}
