import { createProvider } from "puro"
import { useContext, useEffect, useState } from "react"
import { IS_PRODUCTION } from "./utils"

import * as ynab from 'ynab'
import { useAuth } from "./authContext"

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
  const [selectedBudget, setSelectedBudget] = useState("")
  const [categories, setCategories] = useState<null | ynab.CategoryGroupWithCategories[]>(null)

  /** Fetch budgets */
  useEffect(() => {
      if (!ynabAPI) return;

      ynabAPI.budgets.getBudgets()
        .then(budgets => {
          if (!IS_PRODUCTION) console.log("Fetched budgets successfully", budgets)
          setBudgets(budgets.data.budgets)
        })
        .catch(err => console.error("Error fetching budgets", err))
  }, [ynabAPI])

  /** Fetch categories of the selected budget */
  useEffect(() => {
    if (!selectedBudget || !ynabAPI) return;
    
    ynabAPI.categories.getCategories(selectedBudget)
      .then(categories => {
        if (!IS_PRODUCTION) console.log("Fetched categories successfully", categories)
        setCategories(categories.data.category_groups)
      })
      .catch(err => console.error("Error fetching categories", err))

  }, [selectedBudget, ynabAPI])

  return { budgets, categories, selectedBudget, setSelectedBudget }
}

const { BaseContext, Provider } = createProvider(useYNABProvider)

export const useYNAB = () => useContext(BaseContext)
export const YNABProvider = Provider