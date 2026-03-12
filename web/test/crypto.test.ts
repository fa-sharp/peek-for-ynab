import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

import { CryptoService } from "../server/plugins/crypto.ts";
import type { TokenData } from "../server/types";

describe("crypto", () => {
  it("should encrypt and decrypt data", () => {
    const key = randomBytes(32);
    const crypto = new CryptoService([key]);

    const token: TokenData = {
      accessToken: "access",
      refreshToken: "refresh",
      expires: Date.now(),
    };

    const encrypted = crypto.encryptTokenData(token);
    const decrypted = crypto.decryptTokenData(encrypted);

    assert.deepEqual(decrypted, token);
  });

  it("should support multiple keys", () => {
    const oldKey = randomBytes(32);
    const oldCrypto = new CryptoService([oldKey]);

    const token: TokenData = {
      accessToken: "access",
      refreshToken: "refresh",
      expires: Date.now(),
    };
    const encryptedWithOldKey = oldCrypto.encryptTokenData(token);

    const newKey = randomBytes(32);
    const newCrypto = new CryptoService([newKey, oldKey]);
    const encryptedWithNewKey = newCrypto.encryptTokenData(token);

    const decryptedWithOldKey = newCrypto.decryptTokenData(encryptedWithOldKey);
    const decryptedWithNewKey = newCrypto.decryptTokenData(encryptedWithNewKey);
    assert.deepEqual(decryptedWithOldKey, token);
    assert.deepEqual(decryptedWithNewKey, token);
  });

  it("should reject decryption with invalid key", () => {
    const invalidKey = randomBytes(32);
    const invalidCrypto = new CryptoService([invalidKey]);
    const encryptedWithInvalidKey = invalidCrypto.encryptTokenData({
      accessToken: "access",
      refreshToken: "refresh",
      expires: Date.now(),
    });

    const newKey = randomBytes(32);
    const newCrypto = new CryptoService([newKey]);
    assert.throws(() => {
      newCrypto.decryptTokenData(encryptedWithInvalidKey);
    }, /unable to authenticate/);
  });
});
