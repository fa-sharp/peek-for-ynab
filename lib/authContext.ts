import { useStorage } from "@plasmohq/storage"
import { createProvider } from "puro"
import { useContext, useState } from "react"
import * as ynab from 'ynab'

import { IS_PRODUCTION } from "./utils"

const useAuthProvider = () => {

    const [token, setToken, { remove: removeToken }] = useStorage<string>("token", "");

    /** Authenticate the YNAB user with their API token */
    const login = (token: string) => {
        const api = new ynab.API(token)
        api.user.getUser()
            .then(({ data }) => {
                if (!IS_PRODUCTION) console.log("Successfully logged in user: ", data.user.id);
                setToken(token);
            })
            .catch(err => console.error("Login failed: ", err))
    }

    const logout = () => {
        setToken("");
        removeToken();
    };

    return { login, logout, token, authenticated: (token !== "") }
}

const { BaseContext, Provider } = createProvider(useAuthProvider)

/** Hook to authenticate the YNAB user */
export const useAuth = () => useContext(BaseContext)
export const AuthProvider = Provider