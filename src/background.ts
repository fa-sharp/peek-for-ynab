import {
  REFRESH_NEEDED_KEY,
  TOKEN_STORAGE,
  TOKEN_STORAGE_KEY,
  type TokenData
} from "~lib/context/storageContext";

let isRefreshing = false;

TOKEN_STORAGE.watch({
  [REFRESH_NEEDED_KEY]: async (c) => {
    if (c.newValue !== true || isRefreshing) return;

    const tokenData = await TOKEN_STORAGE.get<TokenData | null>(TOKEN_STORAGE_KEY);
    if (!tokenData) {
      console.error("Not refreshing - no existing token data found");
      return;
    }

    isRefreshing = true;
    console.log("Refreshing token!!");

    const refreshUrl = `${process.env.PLASMO_PUBLIC_MAIN_URL || ""}/api/auth/refresh`;
    fetch(`${refreshUrl}?refreshToken=${tokenData.refreshToken}`, { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) await TOKEN_STORAGE.set(TOKEN_STORAGE_KEY, null); // clear token if status is unauthorized
          throw {
            message: "Error refreshing token!",
            status: res.status,
            error: await res.json()
          };
        }
        return res.json();
      })
      .then((newTokenData) => {
        console.log("Got a new token!");
        return TOKEN_STORAGE.set(TOKEN_STORAGE_KEY, newTokenData);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        TOKEN_STORAGE.set(REFRESH_NEEDED_KEY, false).finally(
          () => (isRefreshing = false)
        );
      });
  }
});
