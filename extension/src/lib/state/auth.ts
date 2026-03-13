import { useQuery } from "@tanstack/react-query";
import { use, useCallback, useEffect, useState } from "react";

import { storage } from "#imports";
import { fetchAccessToken } from "~lib/api";
import { ONE_MINUTE_IN_MILLIS, STORAGE_KEYS } from "~lib/constants";
import { useChromeStorage } from "./utils";

/** Encrypted auth token stored in local storage */
export const authTokenStorage = storage.defineItem<string | null>(
  `local:${STORAGE_KEYS.AuthToken}`,
  { fallback: null }
);

/** Unencrypted access token held in memory */
export const accessTokenStorage = storage.defineItem<{
  value: string;
  lastChecked: number;
} | null>(`session:${STORAGE_KEYS.AccessToken}`, {
  fallback: null,
});

/** Access token should be valid for 5 minutes */
const TOKEN_STALE_TIME = ONE_MINUTE_IN_MILLIS * 5;

/** Hook to get and manage the auth state */
export const useAuth = () => {
  // fetch auth token on render to eliminate loading state
  const authTokenQuery = useQuery({
    queryKey: [STORAGE_KEYS.AuthToken],
    queryFn: authTokenStorage.getValue,
    staleTime: Infinity,
  });
  const initialAuthToken = use(authTokenQuery.promise);

  const [authToken, setAuthToken] = useChromeStorage(authTokenStorage, initialAuthToken);
  const [accessToken, setAccessToken] = useChromeStorage(accessTokenStorage);
  const [error, setError] = useState("");

  const accessTokenIsStale =
    !!accessToken && accessToken.lastChecked + TOKEN_STALE_TIME < Date.now();

  const clearToken = useCallback(async () => {
    await setAuthToken(null);
    await setAccessToken(null);
  }, [setAccessToken, setAuthToken]);

  /** Fetch the unencrypted access token from the server, and save it in memory */
  const fetchToken = useCallback(
    async (authToken: string) => {
      setError("");
      try {
        const { data, error } = await fetchAccessToken(authToken);
        if (error) {
          console.warn("failed to get access token:", error.message);
          if (error.status === 401) {
            console.warn("status is unauthorized, logging out...");
            await clearToken();
          }
          setError(error.message);
        } else {
          setError("");
          await setAccessToken({ value: data.accessToken, lastChecked: Date.now() });
          await setAuthToken(data.authToken ? data.authToken : authToken);
        }
      } catch (err: unknown) {
        console.warn("failed to get access token:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [setAuthToken, setAccessToken, clearToken]
  );

  // If auth token is present, fetch access token if it's not in memory and/or is stale
  useEffect(() => {
    if (authToken && (accessToken === null || accessTokenIsStale)) fetchToken(authToken);
  }, [authToken, accessToken, accessTokenIsStale, fetchToken]);

  return {
    error,
    fetchToken,
    authToken,
    accessToken: accessToken?.value && !accessTokenIsStale ? accessToken.value : null,
    clearToken,
  };
};
