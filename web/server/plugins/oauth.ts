import fastifyOauth from "@fastify/oauth2";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastifyPlugin from "fastify-plugin";
import { Type as T } from "typebox";

/** Sets up the OAuth login and callback routes */
export default fastifyPlugin<{
  prefix: string;
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  allowedLoginRedirects?: string[];
}>(async (app, opts) => {
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

  /** Name of the cookie used to store the final redirect URL after OAuth login */
  const REDIRECT_COOKIE_NAME = "peek-oauth-redirect";

  // OAuth login redirect route
  app.withTypeProvider<TypeBoxTypeProvider>().route({
    method: "GET",
    url: `${opts.prefix}/login`,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
    schema: {
      querystring: T.Object({
        redirect_uri: opts.allowedLoginRedirects
          ? T.Enum(opts.allowedLoginRedirects)
          : T.String(),
      }),
    },
    handler: async (req, reply) => {
      const authUrl = await app.oauth.generateAuthorizationUri(req, reply);
      reply.setCookie(REDIRECT_COOKIE_NAME, req.query.redirect_uri, {
        path: opts.prefix,
        secure: true,
        httpOnly: true,
      });
      return reply.redirect(authUrl);
    },
  });

  // OAuth login callback route
  app.route({
    method: "GET",
    url: `${opts.prefix}/callback`,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: "1 minute",
      },
    },
    handler: async (req, reply) => {
      const { token } = await app.oauth.getAccessTokenFromAuthorizationCodeFlow(
        req,
        reply
      );
      if (!token.refresh_token) {
        req.log.warn("No refresh token received from OAuth callback");
        return reply.status(500).send({ message: "Internal server error" });
      }

      // Get and verify the final redirect URL from the temporary cookie
      const redirectUri = req.cookies[REDIRECT_COOKIE_NAME];
      reply.clearCookie(REDIRECT_COOKIE_NAME, { path: opts.prefix });
      if (!redirectUri) {
        return reply.status(400).send({ message: "Missing redirect URL" });
      }
      if (
        opts.allowedLoginRedirects &&
        !opts.allowedLoginRedirects.includes(redirectUri)
      ) {
        return reply.status(401).send({ message: "Disallowed redirect URL" });
      }

      // Encrypt the access and refresh tokens into an opaque token string and add it to the redirect URL
      const encryptedToken = app.crypto.encryptTokenData({
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expires: token.expires_at.getTime(),
      });
      const finalRedirectUrl = new URL(redirectUri);
      finalRedirectUrl.hash = `auth_token=${encryptedToken}`;

      return reply.redirect(finalRedirectUrl.toString());
    },
  });
});
