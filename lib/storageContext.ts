import { useStorage } from "@plasmohq/storage"
import { createProvider } from "puro"
import { useContext } from "react"

/** A category saved by the user */
export interface SavedCategory {
    budgetId: string
    categoryGroupId: string
    categoryId: string
}

const useStorageProvider = () => {

    const [token, setToken, { remove: removeToken }]
        = useStorage("token", "");
    const [selectedBudget, setSelectedBudget, { remove: removeSelectedBudget }]
        = useStorage("selectedBudget", "");
    const [savedCategories, setSavedCategories, { remove: removeSavedCategories }]
        = useStorage<SavedCategory[]>("savedCategories", []);

    const removeAllData = () => {
        setToken("");
        removeToken();

        setSelectedBudget("")
        removeSelectedBudget();
        
        setSavedCategories([]);
        removeSavedCategories();
    }

    return {
        /** The token used to authenticate the YNAB user */
        token, setToken, 
        /** The ID of the budget currently in view */
        selectedBudget, setSelectedBudget,
        /** The categories saved by the user */
        savedCategories, setSavedCategories,
        /** Clears all values, removes all saved data from browser storage */
        removeAllData 
    }
}

const { BaseContext, Provider } = createProvider(useStorageProvider)

/** Hook for storing and retrieving data from browser storage */
export const useStorageContext = () => useContext(BaseContext)
export const StorageProvider = Provider