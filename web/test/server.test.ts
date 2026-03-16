import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createServer } from "../server/server.ts";

describe("server", () => {
  it("should start and stop", async () => {
    const app = await createServer();
    await app.ready();
    await app.close();
  });

  it("should serve all static pages", async () => {
    const app = await createServer();
    await app.ready();
    for (const url of ["/", "/help", "/releases", "/privacy"]) {
      const response = await app.inject({ url });
      assert.equal(response.statusCode, 200, url);
      assert.equal(response.headers["content-type"]?.slice(0, 9), "text/html");
    }
    await app.close();
  });

  it("should serve legacy auth API", async () => {
    const app = await createServer();
    await app.ready();
    for (const url of ["/api/auth/initial", "/api/auth/refresh"]) {
      const response = await app.inject({
        url,
        method: "POST",
        query: { foo: "bar" },
      });
      assert.equal(response.statusCode, 400); // invalid data
      assert.equal(response.headers["content-type"], "application/json");
    }
    await app.close();
  });
});
