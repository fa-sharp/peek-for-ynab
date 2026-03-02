import type { NextRequest } from "next/server";
import { URL } from "url";

import { OAUTH_BASE_URL } from "~lib/constants";
import { logger } from "~lib/logger";
import type { TokenData } from "~lib/types";

const { PLASMO_PUBLIC_YNAB_CLIENT_ID: YNAB_CLIENT_ID, YNAB_SECRET } = process.env;

export const POST = async (req: NextRequest) => {
  if (!YNAB_CLIENT_ID || !YNAB_SECRET)
    return Response.json({ message: "Server error!" }, { status: 500 });

  const refreshToken = req.nextUrl.searchParams.get("refreshToken");
  if (!refreshToken) return Response.json({ message: "Invalid!" }, { status: 400 });

  const tokenUrlParams = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: YNAB_CLIENT_ID,
    client_secret: YNAB_SECRET,
    grant_type: "refresh_token"
  });
  const tokenUrl = new URL(OAUTH_BASE_URL);
  tokenUrl.search = tokenUrlParams.toString();

  try {
    const response = await fetch(tokenUrl.toString(), { method: "POST" });
    if (!response.ok)
      throw {
        message: "Error refreshing OAuth token from YNAB",
        status: response.status,
        errorData: await response.json()
      };
    const data = await response.json();

    const tokenData: TokenData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expires: (data.created_at + data.expires_in) * 1000
    };
    return Response.json(tokenData);
  } catch (err) {
    logger.info(err, "Error during OAuth token refresh");
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }
};
