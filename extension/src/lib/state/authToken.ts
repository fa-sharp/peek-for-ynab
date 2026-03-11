import { storage } from "#imports";
import { STORAGE_KEYS } from "~lib/constants";
import { useChromeStorage } from "./utils";

/** Encrypted auth token, stored locally */
export const authTokenStorage = storage.defineItem<string | null>(
  `local:${STORAGE_KEYS.AuthToken}`,
  { fallback: null }
);

/** Encrypted auth token, stored locally */
export const useAuthToken = () => {
  const [authToken, setAuthToken] = useChromeStorage(authTokenStorage);

  return [authToken, setAuthToken] as const;
};
