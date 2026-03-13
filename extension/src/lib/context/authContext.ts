import { useQueryClient } from "@tanstack/react-query";
import { clear as idbClear } from "idb-keyval";
import { createProvider } from "puro";
import { useCallback, useContext } from "react";

import { browser } from "#imports";
import { useAuth } from "~lib/state";

const useAuthProvider = () => {
  const queryClient = useQueryClient();

  /** The encrypted token that contains the sensitive OAuth tokens to access the YNAB API */
  const { error: authError, authToken, clearToken, fetchToken, accessToken } = useAuth();

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

      await fetchToken(authToken);
    } catch (error) {
      console.error("OAuth login failed:", error);
    }
  }, [queryClient, fetchToken]);

  /** Clears all local data, and revokes the token */
  const logout = useCallback(async () => {
    if (!authToken) return;

    // Revoke OAuth token
    fetch(`${import.meta.env.PUBLIC_MAIN_URL}/api/token/logout`, {
      method: "POST",
      headers: { Authorization: authToken },
    });
    // Clear encrypted token
    await clearToken();
    // Clear API cache
    await idbClear();
    queryClient.removeQueries();
    // Clear all local storage
    await browser.storage.local.clear();
    await browser.storage.session.clear();
    localStorage.clear();
  }, [authToken, clearToken, queryClient]);

  return {
    loginWithOAuth,
    logout,
    loggedIn: !!authToken,
    accessToken,
    authError,
  };
};

const { BaseContext, Provider } = createProvider(useAuthProvider);

/** Hook to authenticate the YNAB user. Manages the encrypted authToken and accessToken. */
export const useAuthContext = () => useContext(BaseContext);
export const AuthProvider = Provider;
