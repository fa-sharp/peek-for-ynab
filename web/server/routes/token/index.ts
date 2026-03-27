import type { FastifyInstance } from "fastify";

import { convertToken } from "../../lib.ts";

/** Token API routes for the browser extension */
export default async function tokenRoutes(app: FastifyInstance) {
  /** Grace period for soon-expiring token (5 minutes) */
  const EXPIRE_GRACE_MILLIS = 5 * 60 * 1000;

  app.route({
    method: "POST",
    url: "/",
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: async (req, reply) => {
      if (!req.token) throw new Error("Expected token on request");

      // If expired, refresh the token and return the updated access token along with the encrypted auth token.
      if (req.token.expires < Date.now() + EXPIRE_GRACE_MILLIS) {
        try {
          req.log.info("Refreshing token");
          const { token } = await app.oauth.getNewAccessTokenUsingRefreshToken(
            convertToken(req.token),
            {}
          );
          if (!token.refresh_token) throw new Error("No new refresh token received");

          const authToken = app.crypto.encryptTokenData({
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            expires: token.expires_at.getTime(),
          });

          return {
            accessToken: token.access_token,
            authToken,
          };
        } catch (err) {
          req.log.warn({ err }, "Failed to refresh token");
          return reply.status(401).send({ message: "Unauthorized" });
        }
      }

      // If not expired, return the existing access token.
      return { accessToken: req.token.accessToken };
    },
  });

  app.route({
    method: "POST",
    url: "/logout",
    config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    handler: async (req, reply) => {
      if (!req.token) throw new Error("Expected token on request");

      try {
        await app.oauth.revokeToken(convertToken(req.token), "refresh_token", undefined);
      } catch (err) {
        req.log.warn({ err }, "Failed to revoke token");
      }

      return reply.status(204).send();
    },
  });
}
