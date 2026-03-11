import type { FastifyInstance } from "fastify";

import { convertToken } from "../../lib.ts";

const FIVE_MINUTES_MILLIS = 5 * 60 * 1000;

/**
 * Token API routes for the browser extension
 */
export default async function tokenRoutes(app: FastifyInstance) {
  app.post("/", async (req, reply) => {
    if (!req.token) throw new Error("Expected token on request");

    // Refresh the token if it's expired or expires in less than 5 minutes,
    // and return the updated access token along with the encrypted auth token.
    if (req.token.expires < Date.now() + FIVE_MINUTES_MILLIS) {
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

    return { accessToken: req.token.accessToken };
  });

  app.post("/logout", async (req, reply) => {
    if (!req.token) throw new Error("Expected token on request");

    try {
      await app.oauth.revokeToken(convertToken(req.token), "refresh_token", undefined);
    } catch (err) {
      req.log.warn({ err }, "Failed to revoke token");
    }

    return reply.status(204).send();
  });
}
