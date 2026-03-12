import { type Static, Type as T } from "typebox";

/** Whether the given request URL represents an API request. */
export function isApiRequest(url: string) {
  return url.startsWith("/api/");
}

/** Type of the encrypted token data. */
export type TokenData = Static<typeof TokenDataSchema>;

/** JSON schema for encrypted token data. */
export const TokenDataSchema = T.Object(
  {
    accessToken: T.String(),
    refreshToken: T.String(),
    expires: T.Integer(),
  },
  { additionalProperties: false }
);

/** Convert the token data to the format expected by Fastify OAuth */
export function convertToken(token: TokenData): import("@fastify/oauth2").Token {
  return {
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expires_at: new Date(token.expires),
    expires_in: 3600,
    token_type: "Bearer",
  };
}
