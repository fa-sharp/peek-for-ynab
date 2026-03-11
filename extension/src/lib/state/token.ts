import { storage } from "#imports";
import { FIVE_MINUTES_IN_MILLIS, STORAGE_KEYS } from "~lib/constants";
import type { TokenData } from "~lib/types";
import { safeMigrateJsonString, useChromeStorage } from "./utils";

/** @deprecated old token storage */
export const tokenDataStorage = storage.defineItem<TokenData | null>(
  `local:${STORAGE_KEYS.Token}`,
  {
    fallback: null,
    version: 3,
    migrations: {
      2: safeMigrateJsonString<TokenData | null>(null),
      3: () => null, // clear the old token on upgrade
    },
  }
);

/** @deprecated old token storage */
export const tokenRefreshingStorage = storage.defineItem<boolean>(
  `session:${STORAGE_KEYS.TokenRefreshing}`,
  { fallback: false }
);

/** @deprecated old token storage, will clear itself on upgrade */
export const useTokenData = () => {
  const [tokenData, setTokenData] = useChromeStorage(tokenDataStorage);
  const [isRefreshing] = useChromeStorage(tokenRefreshingStorage);

  // Token state is loading
  if (tokenData === undefined) return null;

  return {
    tokenData,
    setTokenData,
    /** Token is expired, or expires in less than 5 minutes */
    isExpired: tokenData && tokenData.expires < Date.now() + FIVE_MINUTES_IN_MILLIS,
    /** Token is being refreshed */
    isRefreshing: !!isRefreshing,
  };
};
