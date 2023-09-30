import { Storage } from "@plasmohq/storage";

import { REFRESH_NEEDED_KEY, TOKEN_STORAGE_KEY } from "~lib/constants";
import { type TokenData } from "~lib/context/storageContext";

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

// const backgroundRefreshJob = new Cron(
//   "*/15 * * * * *",
//   {
//     maxRuns: 2
//   },
//   backgroundRefresh
// );
// console.log({ backgroundRefreshJob });

/** Background refreshing of data */
// async function backgroundRefresh() {
//   // Check if token expired
//   const tokenData = await TOKEN_STORAGE.get<TokenData | null>(TOKEN_STORAGE_KEY);
//   if (!tokenData) {
//     console.error("Not refreshing accounts - no existing token data found");
//     return;
//   }
//   if (tokenData.expires < Date.now() + 60 * 1000) {
//     console.log("Not refreshing accounts - token must be refreshed first");
//     await TOKEN_STORAGE.set(REFRESH_NEEDED_KEY, true);
//     return;
//   }

//   console.log("Refreshing accounts!");
//   const ynabAPI = new APIClient(tokenData.accessToken);
//   const queryClient = new QueryClient();
//   const persister = createIDBPersister();
//   await persistQueryClientRestore({
//     queryClient,
//     persister,
//     maxAge: TWO_WEEKS_IN_MILLIS * 2
//   });

//   const storage = new Storage({
//     area: "local"
//   });
//   const budgetIds = await storage.get<string[]>("budgets");

//   await Promise.all(
//     budgetIds.map(async (budgetId) => {
//       const response = await ynabAPI.accounts.getAccounts(budgetId);
//       const accountsData = response.data.accounts.filter((a) => a.closed === false);
//       console.log("Fetched accounts:", { budgetId, accountsData });
//       queryClient.setQueryData(["accounts", { budgetId }], accountsData);
//     })
//   );

//   console.log("Saving new query cache");
//   await persistQueryClientSave({
//     queryClient,
//     persister
//   });
// }
