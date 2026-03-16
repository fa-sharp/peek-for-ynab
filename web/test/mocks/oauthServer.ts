import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

const BASE_URL = "https://app.ynab.com/oauth";

export const mockOauthServer = setupServer(
  http.post(`${BASE_URL}/token`, async ({ request }) => {
    const { grant_type, refresh_token } = Object.fromEntries(await request.formData());
    if (grant_type !== "refresh_token") throw new Error("Missing/unsupported grant type");
    if (!refresh_token) throw new Error("Missing refresh token");

    // standard OAuth token format returned by YNAB
    return HttpResponse.json({
      access_token: "access-token",
      refresh_token: "refresh-token",
      token_type: "bearer",
      expires_in: 7200,
    });
  })
);
