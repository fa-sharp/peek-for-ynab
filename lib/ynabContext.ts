import { createProvider } from "puro"
import { useContext, useEffect, useState } from "react"
import * as ynab from 'ynab'

import { IS_PRODUCTION } from "./utils"
import { useAuth } from "./authContext"
import { useStorageContext } from "./storageContext"

const useYNABProvider = () => {

  const { token, authenticated } = useAuth();
  const [ynabAPI, setYnabAPI] = useState<null | ynab.api>(null);

  /** Initialize ynabAPI object if authenticated */
  useEffect(() => {
    if (token && authenticated)
      setYnabAPI(new ynab.API(token));
    else
      setYnabAPI(null);
  }, [token, authenticated])

  const [budgets, setBudgets] = useState<null | ynab.BudgetSummary[]>(null)

  /** Fetch budgets */
  useEffect(() => {
      if (!ynabAPI)
        return;

      ynabAPI.budgets.getBudgets()
        .then(budgets => {
          if (!IS_PRODUCTION) console.log("Fetched budgets successfully", budgets)
          setBudgets(budgets.data.budgets)
        })
        .catch(err => console.error("Error fetching budgets", err))
  }, [ynabAPI])

  const { selectedBudget } = useStorageContext();
  const [categoryGroups, setCategoryGroups] = useState<null | ynab.CategoryGroupWithCategories[]>(null)
  const [categories, setCategories] = useState<null | ynab.Category[]>(null);

  /** Fetch category groups from the selected budget. Re-runs if the user selects another budget */
  useEffect(() => {
    if (!selectedBudget || !ynabAPI)
      return;
    setCategoryGroups(null);
    
    ynabAPI.categories.getCategories(selectedBudget)
      .then(categories => {
        if (!IS_PRODUCTION) console.log("Fetched categories successfully", categories)
        setCategoryGroups(categories.data.category_groups)

        // Create a flattened category array
        const flattenedCategories = categories.data.category_groups.reduce<ynab.Category[]>((newArray, categoryGroup) => {
          for (let category of categoryGroup.categories)
            newArray.push(category)
          return newArray
        }, []);
        if (!IS_PRODUCTION) console.log("Created flattened category array", flattenedCategories)
        setCategories(flattenedCategories);
      })
      .catch(err => console.error("Error fetching categories", err))

  }, [selectedBudget, ynabAPI])

  return { 
    /** List of user's budgets */
    budgets, 
    /** List of user's category groups, with categories contained in each one */
    categoryGroups,
    /** Flattened list of user's categories (without category groups) */
    categories
  }
}

const { BaseContext, Provider } = createProvider(useYNABProvider)

/** Hook that provides budget data from YNAB */
export const useYNAB = () => useContext(BaseContext)
export const YNABProvider = Provider