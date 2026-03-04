//@ts-check
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createServer } from "../server/server.js";

describe("server", () => {
  it("should start and stop", async () => {
    const app = createServer();
    await app.ready();
    await app.close();
  });

  it("should serve all pages", async () => {
    const app = createServer();
    await app.ready();
    for (const url of ["/", "/help", "/releases", "/privacy"]) {
      const response = await app.inject({ url });
      assert.equal(response.statusCode, 200);
      assert.equal(response.headers["content-type"]?.slice(0, 9), "text/html");
    }
    await app.close();
  });

  it("should serve API requests", async () => {
    const app = createServer();
    await app.ready();
    for (const url of ["/api/auth/initial", "/api/auth/refresh"]) {
      const response = await app.inject({
        url,
        method: "POST",
        body: JSON.stringify({ foo: "bar" }),
        headers: { "content-type": "application/json" },
      });
      assert.equal(response.statusCode, 400); // invalid data
      assert.equal(response.headers["content-type"], "application/json");
    }
    await app.close();
  });
});
