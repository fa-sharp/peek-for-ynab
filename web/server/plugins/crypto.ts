import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Ajv, type ValidateFunction } from "ajv";
import fastifyPlugin from "fastify-plugin";

import { type TokenData, TokenDataSchema } from "../lib.ts";

/** Sets up the service for encrypting and decrypting token data */
export default fastifyPlugin<{ keys: Buffer[] }>(async (app, opts) => {
  const cryptoService = new CryptoService(opts.keys);
  app.decorate("crypto", cryptoService);
});

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const FROM_ENCODING = "utf8";
const TO_ENCODING = "base64url";

export class CryptoService {
  #keys: Buffer[];
  #validate: ValidateFunction<TokenData>;

  constructor(keys: Buffer[]) {
    if (keys.length === 0) {
      throw new Error("Must provide at least one key");
    }
    for (const key of keys) {
      if (key.byteLength !== KEY_LENGTH)
        throw new Error(`Key must be ${KEY_LENGTH} bytes`);
    }
    this.#keys = keys;
    this.#validate = new Ajv().compile(TokenDataSchema);
  }

  encryptTokenData(data: TokenData) {
    if (!this.#validate(data)) {
      throw new Error("Invalid token data");
    }

    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.#keys[0], iv);

    const encrypted =
      cipher.update(JSON.stringify(data), FROM_ENCODING, TO_ENCODING) +
      cipher.final(TO_ENCODING);
    const authTag = cipher.getAuthTag();

    return [authTag.toString(TO_ENCODING), iv.toString(TO_ENCODING), encrypted].join(".");
  }

  decryptTokenData(encrypted: string): TokenData {
    const parts = encrypted.split(".", 3) as [string, string, string];
    if (parts.length !== 3) {
      throw new Error("Invalid format");
    }

    const [authTagStr, ivStr, dataStr] = parts;
    const authTag = Buffer.from(authTagStr, TO_ENCODING);
    const iv = Buffer.from(ivStr, TO_ENCODING);

    let decryptionError;
    for (const key of this.#keys) {
      try {
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        const decrypted =
          decipher.update(dataStr, TO_ENCODING, FROM_ENCODING) +
          decipher.final(FROM_ENCODING);

        const decryptedData = JSON.parse(decrypted);
        if (!this.#validate(decryptedData)) {
          throw new Error("Invalid token data");
        }
        return decryptedData;
      } catch (e) {
        decryptionError = e;
        continue;
      }
    }
    throw decryptionError;
  }
}
