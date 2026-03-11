import fastifyOauth from "@fastify/oauth2";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import fastifyPlugin from "fastify-plugin";
import { Type as T } from "typebox";

/**
 * Sets up the OAuth login and callback routes
 */
const oauthPlugin: FastifyPluginAsyncTypebox<{
  prefix: string;
  clientId: string;
  clientSecret: string;
  baseUrl: string;
}> = async (app, opts) => {
  app.register(fastifyOauth, {
    name: "oauth",
    callbackUri: (req) => `${req.protocol}://${req.host}${opts.prefix}/callback`,
    credentials: {
      client: {
        id: opts.clientId,
        secret: opts.clientSecret,
      },
      auth: {
        tokenHost: opts.baseUrl,
      },
    },
    pkce: "S256",
    scope: ["public"], // read and write access
    redirectStateCookieName: "peek-oauth-state",
    verifierCookieName: "peek-oauth-verifier",
  });

  const REDIRECT_COOKIE_NAME = "peek-oauth-redirect";

  app.route({
    method: "GET",
    url: `${opts.prefix}/login`,
    schema: {
      querystring: T.Object({
        redirect_uri: T.String({
          description: "The final URL to redirect to after OAuth login",
        }),
      }),
    },
    handler: async (req, reply) => {
      const authUrl = new URL(await app.oauth.generateAuthorizationUri(req, reply));
      // Store the final redirect URL in a temporary cookie
      reply.setCookie(REDIRECT_COOKIE_NAME, req.query.redirect_uri, {
        path: opts.prefix,
        secure: true,
        httpOnly: true,
      });
      return reply.redirect(authUrl.toString());
    },
  });

  app.get(`${opts.prefix}/callback`, async (req, reply) => {
    const { token } = await app.oauth.getAccessTokenFromAuthorizationCodeFlow(req, reply);
    if (!token.refresh_token) {
      req.log.warn("No refresh token received from OAuth callback");
      return reply.status(500).send({ message: "Internal server error" });
    }

    // Get the final redirect URL from the temporary cookie
    const redirectUri = req.cookies[REDIRECT_COOKIE_NAME];
    reply.clearCookie(REDIRECT_COOKIE_NAME, { path: opts.prefix });
    if (!redirectUri) {
      return reply.status(400).send({ message: "Missing final redirect URL" });
    }

    const encryptedToken = app.crypto.encryptTokenData({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expires: token.expires_at.getTime(),
    });
    const finalRedirectUrl = new URL(redirectUri);
    finalRedirectUrl.searchParams.set("authToken", encryptedToken);

    return reply.redirect(finalRedirectUrl.toString());
  });
};

export default fastifyPlugin(oauthPlugin);
