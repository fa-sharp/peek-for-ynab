import type { NextApiHandler } from "next";
import { URL } from "url";

import { OAUTH_BASE_URL } from "./initial";

const { NEXT_PUBLIC_YNAB_CLIENT_ID: YNAB_CLIENT_ID, YNAB_SECRET } = process.env;

const handler: NextApiHandler = async (req, res) => {
  if (!YNAB_CLIENT_ID || !YNAB_SECRET)
    return res.status(500).json({ message: "Server error!" });

  if (typeof req.query.refreshToken !== "string")
    return res.status(400).json({ message: "Invalid!" });

  const tokenUrlParams = new URLSearchParams({
    client_id: YNAB_CLIENT_ID,
    client_secret: YNAB_SECRET,
    grant_type: "refresh_token",
    refresh_token: req.query.refreshToken
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

    const tokenData = await response.json();

    return res.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      createdAt: tokenData.created_at,
      expiresInSeconds: tokenData.expires_in
    });
  } catch (err) {
    console.log("Error during OAuth token refresh", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default handler;
