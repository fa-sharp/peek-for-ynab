import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

import { CryptoService } from "../server/plugins/crypto.ts";
import type { TokenData } from "../server/types";

describe("crypto", () => {
  it("should encrypt and decrypt data", () => {
    const key = randomBytes(32);
    const crypto = new CryptoService(key);

    const token: TokenData = {
      accessToken: "access",
      refreshToken: "refresh",
      expires: Date.now(),
    };

    const encrypted = crypto.encryptTokenData(token);
    const decrypted = crypto.decryptTokenData(encrypted);

    assert.deepEqual(decrypted, token);
  });
});
