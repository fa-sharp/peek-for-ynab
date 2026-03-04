/*
Refresh OAuth token endpoint.
*/

import type { APIRoute } from "astro";
import { z } from "astro/zod";

import { YNAB_CLIENT_ID, YNAB_SECRET, YNAB_TOKEN_URL } from "astro:env/server";

export const prerender = false;

const inputSchema = z.string().pipe(
  z.preprocess(
    (text) => JSON.parse(text),
    z.object({
      refreshToken: z.string().min(10),
    })
  )
);

export const POST: APIRoute = async (req) => {
  const { data, error } = inputSchema.safeParse(await req.request.text());
  if (error) return Response.json({ message: "Invalid!" }, { status: 400 });
  const { refreshToken } = data;

  const tokenUrl = new URL(YNAB_TOKEN_URL);
  tokenUrl.search = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: YNAB_CLIENT_ID,
    client_secret: YNAB_SECRET,
    grant_type: "refresh_token",
  }).toString();

  try {
    const tokenResponse = await fetch(tokenUrl, { method: "POST" });
    if (!tokenResponse.ok)
      throw {
        message: "Error refreshing OAuth token from YNAB",
        status: tokenResponse.status,
        errorData: await tokenResponse.json(),
      };
    const data = await tokenResponse.json();

    const tokenData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expires: (data.created_at + data.expires_in) * 1000,
    };
    return Response.json(tokenData);
  } catch (err) {
    req.locals.log.warn({ err }, "Error during OAuth token refresh");

    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
};
