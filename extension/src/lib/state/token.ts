import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { STORAGE_KEYS } from "~lib/constants";
import type { TokenData } from "~lib/types";
import { createJotaiChromeStorage } from "./utils";

/** Internal persisted Jotai atom that holds the access and refresh tokens */
const TOKEN_ATOM = atomWithStorage<TokenData | null>(
  STORAGE_KEYS.Token,
  null,
  createJotaiChromeStorage("local"),
  { getOnInit: true }
);

/** Internal persisted Jotai atom that indicates whether the token is currently being refreshed */
const TOKEN_REFRESHING_ATOM = atomWithStorage<boolean>(
  STORAGE_KEYS.TokenRefreshing,
  false,
  createJotaiChromeStorage("session"),
  { getOnInit: true }
);

/** Jotai atom for getting the current token/auth state, and updating the access and refresh tokens */
export const tokenAtom = atom(
  async (get) => {
    const tokenData = await get(TOKEN_ATOM);
    if (!tokenData) return null;

    const isRefreshing = await get(TOKEN_REFRESHING_ATOM);
    const isExpired = tokenData.expires < Date.now() + 5 * 60 * 1000; // expired or expires in less than 5 minutes
    return {
      ...tokenData,
      isExpired,
      isRefreshing,
    };
  },
  async (_get, set, token: TokenData | null) => {
    await set(TOKEN_ATOM, token);
  }
);

/** Jotai atom that signals whether the token is currently being refreshed */
export const tokenRefreshingAtom = atom(
  (get) => get(TOKEN_REFRESHING_ATOM),
  async (_get, set, value: boolean) => {
    await set(TOKEN_REFRESHING_ATOM, value);
  }
);

export const useTokenData = () => useAtom(tokenAtom);
