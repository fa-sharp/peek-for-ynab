import { useQueryClient } from "@tanstack/react-query";
import { clear as idbClear } from "idb-keyval";
import { customAlphabet, urlAlphabet } from "nanoid";
import { createProvider } from "puro";
import { useContext, useEffect } from "react";
import * as ynab from "ynab";

import { browser } from "#imports";
import { sendMessage } from "~lib/messaging";
import type { TokenData } from "~lib/types";
import { IS_DEV } from "../constants";
import { useStorageContext } from "./storageContext";

const useAuthProvider = () => {
  const { token } = useStorageContext();
  const queryClient = useQueryClient();

  /** If token is expired, send signal to refresh the token */
  useEffect(() => {
    if (token.isExpired && token.tokenData?.refreshToken)
      sendMessage("tokenRefreshNeeded", token.tokenData.refreshToken);
  }, [token.isExpired, token.tokenData?.refreshToken]);

  /** Authenticate the YNAB user with their API token (tests the token by making an API request) */
  const login = (tokenData: TokenData) => {
    const api = new ynab.API(tokenData.accessToken);
    api.user
      .getUser()
      .then(({ data }) => {
        if (IS_DEV) console.log("Successfully logged in user: ", data.user.id);
        token.setTokenData(tokenData);
      })
      .catch((err) => console.error("Login failed: ", err));
  };

  /** Authenticate the YNAB user through OAuth */
  const loginWithOAuth = () =>
    new Promise<void>((resolve, reject) => {
      if (!import.meta.env.PUBLIC_YNAB_CLIENT_ID) return reject("No Client ID found!");

      // Clear API cache and local storage to avoid any leakage of data
      queryClient.removeQueries();
      idbClear();
      localStorage.clear();

      const authorizeUrl = new URL("https://app.ynab.com/oauth/authorize");
      const authorizeState = customAlphabet(urlAlphabet, 15)();
      authorizeUrl.search = new URLSearchParams({
        client_id: import.meta.env.PUBLIC_YNAB_CLIENT_ID,
        redirect_uri: browser?.identity?.getRedirectURL(),
        response_type: "code",
        state: authorizeState,
      }).toString();

      // if no chrome API available, assume we're testing/developing in a regular web browser context
      if (!browser || !browser.identity) {
        window.location.href = authorizeUrl.toString();
        resolve();
      }

      // initiate OAuth flow through chrome API
      browser.identity.launchWebAuthFlow(
        {
          interactive: true,
          url: authorizeUrl.toString(),
        },
        (response) => {
          try {
            if (!response) throw new Error("No response URL!");
            const responseURL = new URL(response);
            const oauthCode = responseURL.searchParams.get("code");
            const returnedState = responseURL.searchParams.get("state");
            if (!oauthCode) throw new Error("No OAuth code found!");
            if (returnedState !== authorizeState)
              throw new Error("State param doesn't match!");

            const initialTokenUrl = new URL(import.meta.env.PUBLIC_MAIN_URL);
            initialTokenUrl.pathname = "/api/auth/initial";

            fetch(initialTokenUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: oauthCode,
                redirectUri: browser.identity.getRedirectURL(),
              }),
            })
              .then((res) => {
                if (!res.ok)
                  throw new Error(`Error getting initial token! Status: ${res.status}`);
                return res.json();
              })
              .then((newTokenData) => {
                if (IS_DEV) console.log("Got a new token!");
                return token.setTokenData(newTokenData);
              })
              .then(() => {
                if (IS_DEV) console.log("Saved new token!");
              })
              .catch((err) => {
                console.error("OAuth login failed: ", err);
                token.setTokenData(null);
              })
              .finally(resolve);
          } catch (err) {
            console.error("OAuth login failed: ", err);
            resolve();
          }
        }
      );
    });

  /** Clears all local data, including the user's token */
  const logout = async () => {
    await token.setTokenData(null);
    await browser.storage.local.clear();
    await idbClear();
    localStorage.clear();
    queryClient.removeQueries();
  };

  return {
    login,
    loginWithOAuth,
    logout,
    /** Whether token data is present. */
    loggedIn: !!token.tokenData,
    /** Whether token is expired and needs to be refreshed. */
    tokenExpired: !!token.isExpired,
    /** Whether token is currently being refreshed. */
    tokenRefreshing: !!token.isRefreshing,
  };
};

const { BaseContext, Provider } = createProvider(useAuthProvider);

/** Hook to authenticate the YNAB user. Manages the access and refresh tokens. */
export const useAuthContext = () => useContext(BaseContext);
export const AuthProvider = Provider;
