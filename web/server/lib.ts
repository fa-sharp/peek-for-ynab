import type { Token } from "@fastify/oauth2";

import type { TokenData } from "./types";

/** Whether the given request URL represents an API request. */
export function isApiRequest(url: string) {
  return url.startsWith("/api/");
}

/** Convert the token data to the format expected by Fastify OAuth */
export function convertToken(token: TokenData): Token {
  return {
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expires_at: new Date(token.expires),
    expires_in: 3600,
    token_type: "Bearer",
  };
}
