import type { NextApiHandler } from "next";
import { URL } from "url";

import type { TokenData } from "~lib/context/storageContext";
import initCorsMiddleware from "~lib/nextCorsMiddleware";

import { OAUTH_BASE_URL } from "./initial";

const { NEXT_PUBLIC_YNAB_CLIENT_ID: YNAB_CLIENT_ID, YNAB_SECRET } = process.env;

const cors = initCorsMiddleware();

const handler: NextApiHandler = async (req, res) => {
  await cors(req, res);

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
    const data = await response.json();

    const tokenData: TokenData = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expires: (data.created_at + data.expires_in) * 1000
    };
    return res.json(tokenData);
  } catch (err) {
    console.log("Error during OAuth token refresh", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default handler;
