import { useQueryClient } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { createProvider } from "puro";
import { useContext, useEffect } from "react";
import * as ynab from "ynab";

import { IS_PRODUCTION } from "../utils";
import type { TokenData } from "./storageContext";
import { useStorageContext } from "./storageContext";

const useAuthProvider = () => {
  const { tokenData, setTokenRefreshNeeded, setTokenData, removeAllData } =
    useStorageContext();

  const queryClient = useQueryClient();

  /** Whether the token is expired (or expires in less than 5 minutes). Will be `false` if token does not exist */
  const tokenExpired = tokenData ? tokenData.expires < Date.now() + 5 * 60 * 1000 : false;

  /** If token is expired (or about to expire in less than 5 minutes) refresh the token */
  useEffect(() => {
    if (tokenData && tokenExpired) setTokenRefreshNeeded(true);
  }, [setTokenRefreshNeeded, tokenData, tokenExpired]);

  /** Authenticate the YNAB user with their API token (tests the token by making an API request) */
  const login = (tokenData: TokenData) => {
    const api = new ynab.API(tokenData.accessToken);
    api.user
      .getUser()
      .then(({ data }) => {
        if (!IS_PRODUCTION) console.log("Successfully logged in user: ", data.user.id);
        setTokenData(tokenData);
      })
      .catch((err) => console.error("Login failed: ", err));
  };

  /** Authenticate the YNAB user through OAuth */
  const loginWithOAuth = () =>
    new Promise<void>((resolve, reject) => {
      if (!process.env.PLASMO_PUBLIC_YNAB_CLIENT_ID) return reject("No Client ID found!");
      // Clear API cache and local storage to avoid any leakage of data
      queryClient.removeQueries();
      queryClient.clear();
      localStorage.clear();

      const authorizeState = nanoid();
      const authorizeParams = new URLSearchParams({
        client_id: process.env.PLASMO_PUBLIC_YNAB_CLIENT_ID,
        redirect_uri:
          chrome?.identity?.getRedirectURL() || "http://localhost:3000/testLogin",
        response_type: "code",
        state: authorizeState
      });
      const authorizeUrl = new URL("https://app.ynab.com/oauth/authorize");
      authorizeUrl.search = authorizeParams.toString();

      // if no chrome API available, assume we're testing/developing in a regular web browser context
      if (!chrome || !chrome.identity) {
        window.location.href = authorizeUrl.toString();
        resolve();
      }

      // initiate OAuth flow through chrome API
      const initialTokenUrl = `${process.env.PLASMO_PUBLIC_MAIN_URL}/api/auth/initial`;
      chrome.identity.launchWebAuthFlow(
        {
          interactive: true,
          url: authorizeUrl.toString()
        },
        (response) => {
          try {
            if (!response) throw "No response URL!";
            const responseURL = new URL(response);
            const oauthCode = responseURL.searchParams.get("code");
            const returnedState = responseURL.searchParams.get("state");
            if (!oauthCode) throw "No OAuth code found!";
            if (returnedState !== authorizeState) throw "State param doesn't match!";

            fetch(
              `${initialTokenUrl}?code=${oauthCode}&redirectUri=${chrome.identity.getRedirectURL()}`,
              {
                method: "POST"
              }
            )
              .then((res) => {
                if (!res.ok)
                  throw { message: "Error getting initial token!", status: res.status };
                return res.json();
              })
              .then((newTokenData) => {
                if (!IS_PRODUCTION) console.log("Got a new token!");
                setTokenData(newTokenData);
              })
              .catch((err) => {
                console.error("OAuth login failed: ", err);
                setTokenData(null);
              })
              .finally(resolve);
          } catch (err) {
            console.error("OAuth login failed: ", err);
            resolve();
          }
        }
      );
    });

  /** Clears all data, including the user's token */
  const logout = async () => {
    await removeAllData();
    queryClient.removeQueries();
    queryClient.clear();
    queryClient.getQueryCache().clear();
  };

  return {
    login,
    loginWithOAuth,
    logout,
    /** Whether authentication/token data is loading */
    authLoading: tokenData === undefined,
    /** Whether token data is present. Check `authLoading` first */
    loggedIn: tokenData != null,
    /** Whether token is expired and needs to be refreshed. */
    tokenExpired
  };
};

const { BaseContext, Provider } = createProvider(useAuthProvider);

/** Hook to authenticate the YNAB user. Manages the access and refresh tokens. */
export const useAuthContext = () => useContext(BaseContext);
export const AuthProvider = Provider;
