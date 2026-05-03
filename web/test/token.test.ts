import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createServer } from "../server/server.ts";
import { mockOauthServer } from "./mocks/oauthServer.ts";

before(() => {
  mockOauthServer.listen({ onUnhandledRequest: "error" });
});

after(() => {
  mockOauthServer.close();
});

describe("API: /token routes", () => {
  it("automatically refreshes expired tokens and returns new tokens", async () => {
    const app = await createServer();
    await app.ready();

    const currentAuthToken = app.crypto.encryptTokenData({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expires: Date.now() + 60 * 1000, // expires in 1 minute, should be refreshed
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/token",
      headers: {
        Authorization: currentAuthToken,
      },
    });
    assert.equal(response.statusCode, 200);
    const { accessToken, authToken } = await response.json();
    assert.equal(accessToken, "access-token");
    assert.partialDeepStrictEqual(app.crypto.decryptTokenData(authToken), {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    await app.close();
  });

  it("does not refresh tokens when not expired", async () => {
    const app = await createServer();
    await app.ready();

    const currentAuthToken = app.crypto.encryptTokenData({
      accessToken: "current-access",
      refreshToken: "current-refresh",
      expires: Date.now() + 30 * 60 * 1000, // active for 30 minutes
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/token",
      headers: {
        Authorization: currentAuthToken,
      },
    });
    assert.equal(response.statusCode, 200);
    const { accessToken, authToken } = await response.json();
    assert.equal(accessToken, "current-access");
    assert.equal(authToken, undefined);

    await app.close();
  });

  it("should rate limit >60 requests in 1 minute", async () => {
    const app = await createServer();
    await app.ready();

    const remoteAddress = "10.0.0.1";
    const token = "fake-token";

    for (let i = 0; i < 60; i++) {
      const response = await app.inject({
        method: "POST",
        url: "/api/token",
        remoteAddress,
        headers: {
          Authorization: token,
        },
      });
      assert.equal(response.statusCode, 401);
    }

    for (let i = 0; i < 4; i++) {
      const response = await app.inject({
        method: "POST",
        url: "/api/token",
        remoteAddress,
        headers: {
          Authorization: token,
        },
      });
      assert.equal(response.statusCode, 429);
    }

    await app.close();
  });
});
