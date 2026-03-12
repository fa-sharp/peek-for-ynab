import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import fastifyPlugin from "fastify-plugin";

import type { TokenData } from "../types";

/** Sets up the service for encrypting and decrypting token data */
export default fastifyPlugin<{ key: Buffer }>(async (app, opts) => {
  const cryptoService = new CryptoService(opts.key);
  app.decorate("crypto", cryptoService);
});

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const FROM_ENCODING = "utf8";
const TO_ENCODING = "base64url";

export class CryptoService {
  #key: Buffer;

  constructor(key: Buffer) {
    if (key.byteLength !== KEY_LENGTH) throw new Error(`Key must be ${KEY_LENGTH} bytes`);
    this.#key = key;
  }

  encryptTokenData(data: TokenData) {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.#key, iv);

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
    const decipher = createDecipheriv(ALGORITHM, this.#key, iv);
    decipher.setAuthTag(authTag);

    const decrypted =
      decipher.update(dataStr, TO_ENCODING, FROM_ENCODING) +
      decipher.final(FROM_ENCODING);

    return JSON.parse(decrypted);
  }
}
