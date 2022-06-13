import { createProvider } from "puro"
import { useContext, useEffect, useState } from "react"
import * as ynab from 'ynab'

const { NODE_ENV, PLASMO_PUBLIC_YNAB_KEY: YNAB_KEY } = process.env
const isProduction = (NODE_ENV === 'production')

const useYNABProvider = () => {
  const ynabAPI = new ynab.API(YNAB_KEY || "");

  const [budgets, setBudgets] = useState<null | ynab.BudgetSummary[]>(null)
  const [selectedBudget, setSelectedBudget] = useState("")
  const [categories, setCategories] = useState<null | ynab.CategoryGroupWithCategories[]>(null)

  /** Fetch budgets */
  useEffect(() => {
      ynabAPI.budgets.getBudgets()
        .then(budgets => {
          if (!isProduction) console.log("Fetched budgets successfully", budgets)
          setBudgets(budgets.data.budgets)
        })
        .catch(err => console.error("Error fetching budgets", err))
  }, [])

  /** Fetch budget info/categories */
  useEffect(() => {
    if (!selectedBudget) return;
    
    ynabAPI.categories.getCategories(selectedBudget)
      .then(categories => {
        if (!isProduction) console.log("Fetched categories successfully", categories)
        setCategories(categories.data.category_groups)
      })
      .catch(err => console.error("Error fetching categories", err))

  }, [selectedBudget])

  return { budgets, categories, selectedBudget, setSelectedBudget }
}

const { BaseContext, Provider } = createProvider(useYNABProvider)

export const useYNAB = () => useContext(BaseContext)
export const YNABProvider = Provider