import { useQuery } from "@tanstack/react-query";
import { use, useCallback, useEffect, useMemo, useState } from "react";

import { storage } from "#imports";
import { fetchAccessToken } from "~lib/api";
import { ONE_MINUTE_IN_MILLIS, STORAGE_KEYS } from "~lib/constants";
import { useChromeStorage } from "./utils";

/** Shape of the access token stored in memory */
interface AccessToken {
  value: string;
  lastChecked: number;
}

/** Encrypted auth token stored in local storage */
export const authTokenStorage = storage.defineItem<string | null>(
  `local:${STORAGE_KEYS.AuthToken}`,
  { fallback: null }
);

/** Unencrypted access token held in memory */
export const accessTokenStorage = storage.defineItem<AccessToken | null>(
  `session:${STORAGE_KEYS.AccessToken}`,
  {
    fallback: null,
  }
);

/** Auth utilities */
export class AuthManager {
  /** Access token is valid for at least 5 minutes */
  static readonly TOKEN_STALE_TIME = ONE_MINUTE_IN_MILLIS * 5;

  /** Whether the in-memory access token is current and can be used */
  static isAccessTokenCurrent(
    accessToken?: AccessToken | null
  ): accessToken is AccessToken {
    return (
      !!accessToken && accessToken.lastChecked + AuthManager.TOKEN_STALE_TIME > Date.now()
    );
  }

  /**
   * Fetch the unencrypted access token from the server, and save it in memory. Will
   * clear the tokens from storage if an unauthorized error is received from the server.
   */
  static async fetchToken(authToken: string) {
    try {
      const { data, error } = await fetchAccessToken(authToken);
      if (error) {
        if (error.status === 401) {
          console.warn("token endpoint returned unauthorized status, logging out...");
          await this.clearToken();
        }
        return { success: false, error: error.message } as const;
      } else {
        await accessTokenStorage.setValue({
          value: data.accessToken,
          lastChecked: Date.now(),
        });
        await authTokenStorage.setValue(data.authToken ? data.authToken : authToken);
        return { success: true, accessToken: data.accessToken } as const;
      }
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      } as const;
    }
  }

  /** Clear tokens from storage */
  static async clearToken() {
    await authTokenStorage.setValue(null);
    await accessTokenStorage.setValue(null);
  }
}

/** React hook to get and manage the auth state */
export const useAuth = () => {
  // get auth token on render to eliminate loading state
  const authTokenQuery = useQuery({
    queryKey: [STORAGE_KEYS.AuthToken],
    queryFn: authTokenStorage.getValue,
    staleTime: Infinity,
  });
  const initialAuthToken = use(authTokenQuery.promise);

  const [authToken] = useChromeStorage(authTokenStorage, {
    initialValue: initialAuthToken,
  });
  const [accessToken] = useChromeStorage(accessTokenStorage);
  const [error, setError] = useState("");

  const isAccessTokenCurrent = useMemo(
    () => AuthManager.isAccessTokenCurrent(accessToken),
    [accessToken]
  );

  const fetchToken = useCallback(async (authToken: string) => {
    setError("");
    const { success, error } = await AuthManager.fetchToken(authToken);
    if (!success) {
      console.warn("failed to get access token:", error);
      setError(error);
    }
  }, []);

  const clearToken = useCallback(() => AuthManager.clearToken(), []);

  // If auth token is present, fetch access token if it's not in memory and/or is stale
  useEffect(() => {
    if (authToken && !isAccessTokenCurrent) fetchToken(authToken);
  }, [authToken, isAccessTokenCurrent, fetchToken]);

  return {
    /** Error that ocurred during auth flow */
    error,
    /** Fetch and save the access token in memory */
    fetchToken,
    /** The current auth token */
    authToken,
    /** The current access token */
    accessToken: accessToken?.value && isAccessTokenCurrent ? accessToken.value : null,
    /** Clear the access token and auth token (e.g. on logout) */
    clearToken,
  };
};
