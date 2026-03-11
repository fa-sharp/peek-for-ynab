import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clear as idbClear } from "idb-keyval";
import { createProvider } from "puro";
import { useCallback, useContext } from "react";

import { browser } from "#imports";
import { FIVE_MINUTES_IN_MILLIS } from "~lib/constants";
import { useStorageContext } from "./storageContext";

const useAuthProvider = () => {
  const { authToken, setAuthToken } = useStorageContext();
  const queryClient = useQueryClient();

  /** Fetch current access token from the server */
  const { data: accessToken, status: accessTokenStatus } = useQuery({
    queryKey: ["accessToken"],
    enabled: !!authToken,
    retry: false,
    staleTime: FIVE_MINUTES_IN_MILLIS, // access token should be valid for at least 5 minutes
    queryFn: async () => {
      if (!authToken) return null;
      const res = await fetch(`${import.meta.env.PUBLIC_MAIN_URL}/api/token`, {
        method: "POST",
        headers: { Authorization: authToken },
      });
      if (res.ok) {
        const data: { accessToken: string; authToken?: string } = await res.json();
        if (data.authToken) await setAuthToken(data.authToken); // Set the new auth token if returned
        return data.accessToken;
      } else {
        const message = await res.text();
        console.error(`Failed to get access token. Status ${res.status}: ${message}`);
        await setAuthToken(null);
        return null;
      }
    },
  });

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

    fetch(`${import.meta.env.PUBLIC_MAIN_URL}/api/token/logout`, {
      method: "POST",
      headers: { Authorization: authToken },
    });

    await setAuthToken(null);
    queryClient.removeQueries();
    queryClient.clear();

    await idbClear();
    await browser.storage.local.clear();
    localStorage.clear();
  }, [authToken, setAuthToken, queryClient]);

  return {
    loginWithOAuth,
    logout,
    /** Whether the user is logged in (i.e. `authToken` is present) */
    loggedIn: !!authToken,
    accessToken,
    accessTokenStatus,
  };
};

const { BaseContext, Provider } = createProvider(useAuthProvider);

/** Hook to authenticate the YNAB user. Manages the access and refresh tokens. */
export const useAuthContext = () => useContext(BaseContext);
export const AuthProvider = Provider;
