import type { OAuth2Namespace } from "@fastify/oauth2";
import type { Static } from "typebox";

import type { CryptoService } from "./plugins/crypto";

// Augment the types on the server and request
declare module "fastify" {
  interface FastifyInstance {
    /** Parsed config / environment variables */
    config: Static<typeof import("./server").envSchema>;
    /** OAuth utils */
    oauth: OAuth2Namespace;
    /** Crypto utils */
    crypto: CryptoService;
  }

  interface FastifyRequest {
    /** The decrypted token */
    token: TokenData | null;
  }
}
