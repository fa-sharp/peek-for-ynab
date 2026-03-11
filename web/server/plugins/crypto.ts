import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { Token } from "@fastify/oauth2";
import type { FastifyPluginAsync } from "fastify";
import fastifyPlugin from "fastify-plugin";

/**
 * Sets up the service for encrypting and decrypting token data
 */
const cryptoPlugin: FastifyPluginAsync<{ key: Buffer }> = async (app, opts) => {
  const cryptoService = new CryptoService(opts.key);
  app.decorate("crypto", cryptoService);
};

const ALGORITHM = "aes-256-gcm";
const TAG_LENGTH = 16;
const TAG_LENGTH_BASE64 = 22;
const FROM_ENCODING = "utf8";
const TO_ENCODING = "base64url";

export class CryptoService {
  key: Buffer;

  constructor(key: Buffer) {
    this.key = key;
  }

  encryptTokenData(data: Token) {
    const iv = randomBytes(TAG_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    let encrypted = cipher.update(JSON.stringify(data), FROM_ENCODING, TO_ENCODING);
    encrypted += cipher.final(TO_ENCODING);
    return iv.toString(TO_ENCODING) + encrypted;
  }

  decryptTokenData(encrypted: string): Token {
    const iv = Buffer.from(encrypted.slice(0, TAG_LENGTH_BASE64), TO_ENCODING);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    let decrypted = decipher.update(
      encrypted.slice(TAG_LENGTH_BASE64),
      TO_ENCODING,
      FROM_ENCODING
    );
    decrypted += decipher.final(FROM_ENCODING);
    return JSON.parse(decrypted);
  }
}

export default fastifyPlugin(cryptoPlugin);
