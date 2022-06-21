import { createProvider } from "puro";
import { useCallback, useContext, useEffect } from "react";
import * as ynab from "ynab";

import { IS_PRODUCTION } from "../utils";
import { TokenData, useStorageContext } from "./storageContext";

const { PLASMO_PUBLIC_MAIN_URL, PLASMO_PUBLIC_YNAB_CLIENT_ID } = process.env;

const useAuthProvider = () => {
  const { tokenData, setTokenData, removeAllData } = useStorageContext();

  /** Whether the token is expired (or expires in less than 5 minutes). Will be `false` if token does not exist */
  const tokenExpired = tokenData ? tokenData.expires < Date.now() + 5 * 60 * 1000 : false;

  /** Callback to fetch and refresh the access token */
  const refresh = useCallback(() => {
    if (!tokenData) return;
    if (!IS_PRODUCTION) console.log("Refreshing token!!");

    const refreshUrl = `${PLASMO_PUBLIC_MAIN_URL || ""}/api/auth/refresh`;
    fetch(`${refreshUrl}?refreshToken=${tokenData.refreshToken}`)
      .then((res) => {
        if (!res.ok) throw { message: "Error refreshing token!", status: res.status };
        return res.json();
      })
      .then((newTokenData) => {
        if (!IS_PRODUCTION) console.log("Got a new token!");
        setTokenData(newTokenData);
      })
      .catch((err) => {
        console.error(err);
        setTokenData(null);
      });
  }, [setTokenData, tokenData]);

  /** If token is expired (or about to expire in less than 5 minutes) refresh the token */
  useEffect(() => {
    if (tokenData && tokenExpired) {
      refresh();
    }
  }, [refresh, tokenData, tokenExpired]);

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
  const loginWithOAuth = () => {
    if (!chrome || !chrome.identity) return;

    const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`;
    const initialTokenUrl = `${PLASMO_PUBLIC_MAIN_URL || ""}/api/auth/initial`;

    chrome.identity.launchWebAuthFlow(
      {
        interactive: true,
        url: `https://app.youneedabudget.com/oauth/authorize?client_id=${PLASMO_PUBLIC_YNAB_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=read-only`
      },
      (responseUrl) => {
        try {
          if (!responseUrl) throw "No response URL!";
          const oAuthCode = new URL(responseUrl).searchParams.get("code");
          if (!oAuthCode) throw "No OAuth code found!";

          fetch(`${initialTokenUrl}?code=${oAuthCode}&redirectUri=${redirectUri}`)
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
            });
        } catch (err) {
          console.error("OAuth login failed: ", err);
        }
      }
    );
  };

  /** Clears all data, including the user's token */
  const logout = async () => {
    await setTokenData(null);
    removeAllData();
  };

  return { login, loginWithOAuth, logout, loggedIn: tokenData != null, tokenExpired };
};

const { BaseContext, Provider } = createProvider(useAuthProvider);

/** Hook to authenticate the YNAB user */
export const useAuthContext = () => useContext(BaseContext);
export const AuthProvider = Provider;
