import { Storage } from "@plasmohq/storage";

import { REFRESH_NEEDED_KEY, TOKEN_STORAGE_KEY } from "~lib/constants";
import type { TokenData } from "~lib/types";

const tokenStorage = new Storage({ area: "local" });
let isRefreshing = false;

tokenStorage.watch({
  [REFRESH_NEEDED_KEY]: async (c) => {
    if (c.newValue !== true || isRefreshing) return;

    const tokenData = await tokenStorage.get<TokenData | null>(TOKEN_STORAGE_KEY);
    if (!tokenData) {
      console.error("Not refreshing - no existing token data found");
      return;
    }

    isRefreshing = true;
    process.env.NODE_ENV !== "production" && console.log("Refreshing token!");

    const refreshUrl = `${process.env.PLASMO_PUBLIC_MAIN_URL || ""}/api/auth/refresh`;
    fetch(`${refreshUrl}?refreshToken=${tokenData.refreshToken}`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) await tokenStorage.set(TOKEN_STORAGE_KEY, null); // clear token if status is unauthorized
          throw {
            message: "Error refreshing token!",
            status: res.status,
            error: await res.json()
          };
        }
        return res.json();
      })
      .then((newTokenData) => {
        process.env.NODE_ENV !== "production" && console.log("Got a new token!");
        return tokenStorage.set(TOKEN_STORAGE_KEY, newTokenData);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        tokenStorage.set(REFRESH_NEEDED_KEY, false).finally(() => (isRefreshing = false));
      });
  }
});
