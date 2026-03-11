import { useEffect } from "react";

import { storage } from "#imports";
import { STORAGE_KEYS } from "~lib/constants";
import type { TokenData } from "~lib/types";
import { useChromeStorage } from "./utils";

/** @deprecated old token storage */
export const tokenDataStorage = storage.defineItem<TokenData | null>(
  `local:${STORAGE_KEYS.Token}`,
  { fallback: null }
);

/** @deprecated old token storage, will auto-clear itself */
export const useTokenData = () => {
  const [tokenData, setTokenData] = useChromeStorage(tokenDataStorage);

  // Clear old token data
  useEffect(() => {
    tokenDataStorage.removeValue();
    tokenDataStorage.removeMeta();
  }, []);

  return {
    tokenData,
    setTokenData,
  };
};
