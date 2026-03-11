import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createServer } from "../server/server.ts";
import { mockOauthServer } from "./mocks/oauthServer.ts";

before(() => {
  mockOauthServer.listen({ onUnhandledRequest: "error" });
});

after(() => {
  mockOauthServer.close();
  mockOauthServer.dispose();
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
      accessToken: "access",
      refreshToken: "refresh",
      expires: Date.now() + 10 * 60 * 1000, // active for 10 minutes
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
    assert.equal(accessToken, "access");
    assert.equal(authToken, undefined);

    await app.close();
  });
});
