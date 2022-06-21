import { createProvider } from "puro";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as ynab from "ynab";

import { IS_PRODUCTION } from "../utils";
import { useAuthContext } from "./authContext";
import { CachedBudget, useStorageContext } from "./storageContext";

const useYNABProvider = () => {
  const { tokenExpired, loggedIn } = useAuthContext();
  const {
    tokenData,
    selectedBudgetId,
    savedCategories,
    cachedBudgets,
    setCachedBudgets
  } = useStorageContext();

  const [ynabAPI, setYnabAPI] = useState<null | ynab.api>(null);

  /** Initialize ynabAPI object if authenticated */
  useEffect(() => {
    if (tokenData && !tokenExpired) setYnabAPI(new ynab.API(tokenData.accessToken));
    else setYnabAPI(null);
  }, [tokenData, tokenExpired]);

  /** Fetch user's budgets and store/refresh the cache. */
  const refreshBudgets = useCallback(async () => {
    if (!ynabAPI) return;
    try {
      const budgetsData = await ynabAPI.budgets.getBudgets();
      if (!IS_PRODUCTION) console.log("Fetched budgets successfully", budgetsData);
      const newCachedBudgets: CachedBudget[] = budgetsData.data.budgets.map(
        (budgetSummary, index) => ({
          id: budgetSummary.id,
          name: budgetSummary.name,
          currencyFormat: budgetSummary.currency_format || undefined,
          show: !cachedBudgets
            ? index < 5 // if there's no cache (e.g. initial login), show first 5 budgets
            : cachedBudgets.find((b) => b.id === budgetSummary.id)?.show || false // Retain show/hide settings. New budgets are hidden by default
        })
      );
      setCachedBudgets(newCachedBudgets);
    } catch (err) {
      console.error("Error fetching budgets", err);
    }
  }, [cachedBudgets, setCachedBudgets, ynabAPI]);

  /** Automatically fetch budgets from API if there is no cached budget data */
  useEffect(() => {
    if (loggedIn && !tokenExpired && !cachedBudgets) refreshBudgets();
  }, [loggedIn, cachedBudgets, tokenExpired, refreshBudgets]);

  const [categoryGroupsData, setCategoryGroupsData] = useState<
    null | ynab.CategoryGroupWithCategories[]
  >(null);
  const [categoriesData, setCategoriesData] = useState<null | ynab.Category[]>(null);

  /** Fetch categories from API for the selected budget. Re-runs if the user selects another budget */
  useEffect(() => {
    if (!selectedBudgetId || !ynabAPI) return;

    ynabAPI.categories
      .getCategories(selectedBudgetId)
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

    return () => {
      // cleanup as user switches budgets or when they logout
      setCategoryGroupsData(null);
      setCategoriesData(null);
    };
  }, [selectedBudgetId, ynabAPI]);

  const savedCategoriesData = useMemo(() => {
    if (!categoriesData || !savedCategories) return null; // If there's no data, return empty array

    // For each saved category in the current budget, grab the category data and add to array
    return savedCategories.reduce<ynab.Category[]>((newArray, savedCategory) => {
      if (savedCategory.budgetId === selectedBudgetId) {
        const categoryData = categoriesData.find(
          (category) => category.id === savedCategory.categoryId
        );
        if (categoryData) newArray.push(categoryData);
      }
      return newArray;
    }, []);
  }, [categoriesData, savedCategories, selectedBudgetId]);

  return {
    /** API data: List of user's category groups, with categories contained in each one */
    categoryGroupsData,
    /** API data: Flattened list of all of user's categories (without category groups) */
    categoriesData,
    /** API data: List of saved categories in the currently selected budget */
    savedCategoriesData,
    /** Fetch user's budgets from API and store/refresh the cache */
    refreshBudgets
  };
};

const { BaseContext, Provider } = createProvider(useYNABProvider);

/** Hook that provides user's budget data from YNAB */
export const useYNABContext = () => useContext(BaseContext);
export const YNABProvider = Provider;
