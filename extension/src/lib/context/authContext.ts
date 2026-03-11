import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clear as idbClear } from "idb-keyval";
import { createProvider } from "puro";
import { useCallback, useContext, useEffect } from "react";

import { browser } from "#imports";
import { fetchAccessToken } from "~lib/api";
import { FIVE_MINUTES_IN_MILLIS } from "~lib/constants";
import { tokenPersister } from "~lib/queryClient";
import { useStorageContext } from "./storageContext";

const useAuthProvider = () => {
  const { authToken, setAuthToken } = useStorageContext();
  const queryClient = useQueryClient();

  /** Fetch current access token from the server */
  const { data: tokenData, status: tokenStatus } = useQuery({
    queryKey: ["accessToken"],
    enabled: !!authToken,
    staleTime: FIVE_MINUTES_IN_MILLIS, // access token should be valid for at least 5 minutes
    persister: tokenPersister.persisterFn,
    queryFn: async () => {
      if (!authToken) return null;
      const { data, error } = await fetchAccessToken(authToken);
      if (!data) throw new Error(`Failed to get access token: ${error}`);
      return data;
    },
  });
  // Update authToken if received
  useEffect(() => {
    if (tokenStatus === "error") setAuthToken(null);
    else if (tokenStatus === "success" && tokenData?.authToken)
      setAuthToken(tokenData.authToken);
  }, [tokenStatus, setAuthToken, tokenData?.authToken]);

  /** Authenticate the YNAB user through OAuth */
  const loginWithOAuth = useCallback(async () => {
    // Clear API cache to avoid any leakage of data
    queryClient.removeQueries();
    await idbClear();

    // Create the authorize URL and add the extension's unique redirect URL
    const authorizeUrl = new URL(import.meta.env.PUBLIC_MAIN_URL);
    authorizeUrl.pathname = "/api/auth/v2/login";
    authorizeUrl.searchParams.append("redirect_uri", browser.identity.getRedirectURL());

    // initiate OAuth flow
    try {
      const responseUrl = await browser.identity.launchWebAuthFlow({
        interactive: true,
        url: authorizeUrl.toString(),
      });
      if (!responseUrl) throw new Error("No response URL received");
      const url = new URL(responseUrl);
      const authToken = url.searchParams.get("auth_token");
      if (!authToken) throw new Error("No auth token received");

      await setAuthToken(authToken);
    } catch (error) {
      console.error("OAuth login failed:", error);
    }
  }, [queryClient, setAuthToken]);

  /** Clears all local data, and revokes the token */
  const logout = useCallback(async () => {
    if (!authToken) return;

    // Revoke OAuth token
    fetch(`${import.meta.env.PUBLIC_MAIN_URL}/api/token/logout`, {
      method: "POST",
      headers: { Authorization: authToken },
    });
    await idbClear(); // Clear persisted API cache
    await setAuthToken(null); // Clear encrypted token
    queryClient.clear(); // Clear in-memory cache
    await browser.storage.local.clear(); // Clear browser local storage
    localStorage.clear();
  }, [authToken, setAuthToken, queryClient]);

  return {
    loginWithOAuth,
    logout,
    /** Whether the user is logged in (i.e. `authToken` is present) */
    loggedIn: !!authToken,
    accessToken: tokenData?.accessToken,
    accessTokenStatus: tokenStatus,
  };
};

const { BaseContext, Provider } = createProvider(useAuthProvider);

/** Hook to authenticate the YNAB user. Manages the encrypted authToken and accessToken. */
export const useAuthContext = () => useContext(BaseContext);
export const AuthProvider = Provider;
