import { createProvider } from "puro";
import { useContext, useEffect, useMemo, useState } from "react";
import * as ynab from "ynab";

import { useAuth } from "./authContext";
import { useStorageContext } from "./storageContext";
import { IS_PRODUCTION } from "./utils";

const useYNABProvider = () => {
  const { token, authenticated } = useAuth();
  const { selectedBudget, savedCategories } = useStorageContext();

  const [ynabAPI, setYnabAPI] = useState<null | ynab.api>(null);

  /** Initialize ynabAPI object if authenticated */
  useEffect(() => {
    if (token && authenticated) setYnabAPI(new ynab.API(token));
    else setYnabAPI(null);
  }, [token, authenticated]);

  const [budgetsData, setBudgetsData] = useState<null | ynab.BudgetSummary[]>(null);

  /** Fetch budgets */
  useEffect(() => {
    if (!ynabAPI) return;

    ynabAPI.budgets
      .getBudgets()
      .then((budgets) => {
        if (!IS_PRODUCTION) console.log("Fetched budgets successfully", budgets);
        setBudgetsData(budgets.data.budgets);
      })
      .catch((err) => console.error("Error fetching budgets", err));
  }, [ynabAPI]);

  const [categoryGroupsData, setCategoryGroupsData] = useState<
    null | ynab.CategoryGroupWithCategories[]
  >(null);
  const [categoriesData, setCategoriesData] = useState<null | ynab.Category[]>(null);

  /** Fetch category groups from the selected budget. Re-runs if the user selects another budget */
  useEffect(() => {
    setCategoryGroupsData(null);
    if (!selectedBudget || !ynabAPI) return;

    ynabAPI.categories
      .getCategories(selectedBudget)
      .then((categories) => {
        if (!IS_PRODUCTION) console.log("Fetched categories successfully", categories);
        setCategoryGroupsData(categories.data.category_groups);

        // Create a flattened category array
        const flattenedCategories = categories.data.category_groups.reduce<
          ynab.Category[]
        >((newArray, categoryGroup) => {
          for (const category of categoryGroup.categories) newArray.push(category);
          return newArray;
        }, []);
        setCategoriesData(flattenedCategories);
      })
      .catch((err) => console.error("Error fetching categories", err));
  }, [selectedBudget, ynabAPI]);

  const savedCategoriesData = useMemo(() => {
    if (!categoriesData || !savedCategories) return []; // If there's no data, return empty array

    // For each saved category in the current budget, grab the category data and add to array
    return savedCategories.reduce<ynab.Category[]>((newArray, savedCategory) => {
      if (savedCategory.budgetId === selectedBudget) {
        const categoryData = categoriesData.find(
          (category) => category.id === savedCategory.categoryId
        );
        if (categoryData) newArray.push(categoryData);
      }
      return newArray;
    }, []);
  }, [categoriesData, savedCategories, selectedBudget]);

  return {
    /** API data: List of user's budgets */
    budgetsData,
    /** API data: List of user's category groups, with categories contained in each one */
    categoryGroupsData,
    /** API data: Flattened list of all of user's categories (without category groups) */
    categoriesData,
    /** API data: List of saved categories in the currently selected budget */
    savedCategoriesData
  };
};

const { BaseContext, Provider } = createProvider(useYNABProvider);

/** Hook that provides user's budget data from YNAB */
export const useYNAB = () => useContext(BaseContext);
export const YNABProvider = Provider;
