import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import type { Token } from "@fastify/oauth2";

import { CryptoService } from "../server/plugins/crypto.ts";

describe("crypto", () => {
  it("should encrypt and decrypt data", () => {
    const key = randomBytes(32);
    const crypto = new CryptoService(key);

    const token: Token = {
      access_token: "access",
      refresh_token: "refresh",
      token_type: "Bearer",
      expires_in: 3600,
      expires_at: new Date(Date.now() + 3600 * 1000),
    };

    const encrypted = crypto.encryptTokenData(token);
    const decrypted = crypto.decryptTokenData(encrypted);

    assert.deepEqual(decrypted, {
      ...token,
      expires_at: token.expires_at.toISOString(),
    });
  });
});
