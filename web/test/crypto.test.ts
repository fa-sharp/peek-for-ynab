import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";

import type { TokenData } from "../server/lib.ts";
import { CryptoService } from "../server/plugins/crypto.ts";

describe("crypto", () => {
  it("should encrypt and decrypt data", () => {
    const crypto = new CryptoService([randomBytes(32)]);

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
    const invalidCrypto = new CryptoService([randomBytes(32)]);
    const encryptedWithInvalidKey = invalidCrypto.encryptTokenData({
      accessToken: "access",
      refreshToken: "refresh",
      expires: Date.now(),
    });

    const newCrypto = new CryptoService([randomBytes(32)]);
    assert.throws(() => {
      newCrypto.decryptTokenData(encryptedWithInvalidKey);
    }, /unable to authenticate/);
  });

  it("should reject encryption of invalid token data", () => {
    const crypto = new CryptoService([randomBytes(32)]);
    const invalidToken: TokenData = {
      accessToken: "access",
      refreshToken: "refresh",
      expires: 2.44,
    };

    assert.throws(() => {
      crypto.encryptTokenData(invalidToken);
    }, /Invalid token data/);
  });
});
