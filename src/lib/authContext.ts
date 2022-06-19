import { createProvider } from "puro";
import { useCallback, useContext, useEffect } from "react";
import * as ynab from "ynab";

import { TokenData, useStorageContext } from "./storageContext";
import { IS_PRODUCTION } from "./utils";

const { PLASMO_PUBLIC_REFRESH_URL } = process.env;

const useAuthProvider = () => {
  const { tokenData, setTokenData, removeAllData } = useStorageContext();

  /** Whether the token is expired (or expires in less than 5 minutes). Will be `false` if token does not exist */
  const tokenExpired = tokenData ? tokenData.expires < Date.now() + 5 * 60 * 1000 : false;

  /** Callback to fetch and refresh the access token */
  const refresh = useCallback(() => {
    if (!tokenData) return;
    if (!IS_PRODUCTION) console.log("Refreshing token!!");

    const baseUrl = PLASMO_PUBLIC_REFRESH_URL || "/api/auth/refresh";
    fetch(`${baseUrl}?refreshToken=${tokenData.refreshToken}`)
      .then((res) => {
        if (!res.ok) throw { message: "Error refreshing token!", status: res.status };
        return res.json();
      })
      .then(async (newTokenData) => {
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

  /** Clears all data, including the user's token */
  const logout = () => {
    setTokenData(null);
    removeAllData();
  };

  return { login, logout, loggedIn: tokenData !== null, tokenExpired };
};

const { BaseContext, Provider } = createProvider(useAuthProvider);

/** Hook to authenticate the YNAB user */
export const useAuth = () => useContext(BaseContext);
export const AuthProvider = Provider;
