import {
  type Account,
  type CategoryGroupWithCategories,
  GetTransactionsTypeEnum,
  type api
} from "ynab";

import { IS_DEV } from "./utils";

/** Fetch budgets from the YNAB API */
export async function fetchBudgets(ynabAPI: api) {
  const {
    data: { budgets }
  } = await ynabAPI.budgets.getBudgets();
  // Sort budgets by last modified
  budgets.sort((a, b) =>
    a.last_modified_on &&
    b.last_modified_on &&
    new Date(a.last_modified_on).valueOf() < new Date(b.last_modified_on).valueOf()
      ? 1
      : -1
  );
  IS_DEV && console.log("Fetched budgets!", budgets);
  return budgets.map((budgetSummary) => ({
    id: budgetSummary.id,
    name: budgetSummary.name,
    currencyFormat: budgetSummary.currency_format || undefined
  }));
}

/** Use a delta request if cached data is fresher than this (2 hours) */
const DELTA_REQUEST_TIME = 1000 * 60 * 60 * 2;

/** Fetch category groups for this budget from the YNAB API */
export async function fetchCategoryGroupsForBudget(
  ynabAPI: api,
  selectedBudgetId: string,
  cache?: {
    data?: {
      serverKnowledge: number;
      categoryGroups: CategoryGroupWithCategories[];
    };
    dataUpdatedAt: number;
  }
) {
  const usingDeltaRequest =
    !!cache?.data && cache.dataUpdatedAt > Date.now() - DELTA_REQUEST_TIME;
  const response = await ynabAPI.categories.getCategories(
    selectedBudgetId,
    usingDeltaRequest ? cache.data?.serverKnowledge : undefined
  );

  let categoryGroups: CategoryGroupWithCategories[];
  if (usingDeltaRequest && cache.data) {
    categoryGroups = mergeCategoryGroupsDataFromDelta(
      cache.data.categoryGroups,
      response.data.category_groups
    );
  } else {
    categoryGroups = response.data.category_groups;
  }

  // filter out hidden groups and categories
  categoryGroups = categoryGroups.filter((group) => !group.hidden);
  categoryGroups.forEach(
    (cg) => (cg.categories = cg.categories.filter((c) => !c.hidden))
  );
  IS_DEV &&
    console.log("Fetched categories!", {
      categoryGroups,
      usingDeltaRequest,
      serverKnowledge: response.data.server_knowledge
    });
  return { categoryGroups, serverKnowledge: response.data.server_knowledge };
}

function mergeCategoryGroupsDataFromDelta(
  existingData: CategoryGroupWithCategories[],
  deltaResponse: CategoryGroupWithCategories[]
) {
  let categoryGroups = structuredClone(existingData);
  for (const categoryGroupDelta of deltaResponse) {
    if (categoryGroupDelta.deleted) {
      categoryGroups = categoryGroups.filter((cg) => cg.id !== categoryGroupDelta.id);
      continue;
    }

    const categoryGroupIdx = categoryGroups.findIndex(
      (cg) => cg.id === categoryGroupDelta.id
    );
    if (categoryGroupIdx === -1) {
      categoryGroups.push(categoryGroupDelta); // new category group
    } else {
      // update existing category group
      categoryGroups[categoryGroupIdx].name = categoryGroupDelta.name;
      categoryGroups[categoryGroupIdx].hidden = categoryGroupDelta.hidden;

      const categories = categoryGroups[categoryGroupIdx].categories;
      for (const categoryDelta of categoryGroupDelta.categories) {
        const categoryIdx = categories.findIndex((c) => c.id === categoryDelta.id);
        if (categoryIdx === -1) {
          categories.push(categoryDelta); // new category
        } else if (categoryDelta.deleted) {
          categories.splice(categoryIdx, 1); // deleted category
        } else {
          categories.splice(categoryIdx, 1, categoryDelta); // update existing category
        }
      }
    }
  }
  return categoryGroups;
}

/** Fetch accounts for this budget from the YNAB API */
export async function fetchAccountsForBudget(
  ynabAPI: api,
  selectedBudgetId: string,
  cache?: {
    data?: {
      serverKnowledge: number;
      accounts: Account[];
    };
    dataUpdatedAt: number;
  }
) {
  const usingDeltaRequest =
    !!cache?.data && cache.dataUpdatedAt > Date.now() - DELTA_REQUEST_TIME;
  const response = await ynabAPI.accounts.getAccounts(
    selectedBudgetId,
    usingDeltaRequest ? cache.data?.serverKnowledge : undefined
  );

  let accounts: Account[];
  if (usingDeltaRequest && cache.data) {
    accounts = mergeAccountsDataFromDelta(cache.data.accounts, response.data.accounts);
  } else {
    accounts = response.data.accounts;
  }

  // filter out closed accounts, and sort with Budget accounts first
  accounts = accounts
    .filter((a) => a.closed === false)
    .sort((a, b) =>
      a.on_budget && !b.on_budget ? -1 : !a.on_budget && b.on_budget ? 1 : 0
    );
  IS_DEV && console.log("Fetched accounts!", accounts);
  return { accounts, serverKnowledge: response.data.server_knowledge };
}

function mergeAccountsDataFromDelta(existingData: Account[], deltaResponse: Account[]) {
  const accounts = [...existingData];
  for (const accountDelta of deltaResponse) {
    const accountIdx = accounts.findIndex((a) => a.id === accountDelta.id);
    if (accountIdx === -1) {
      accounts.push(accountDelta); // new account
    } else if (accountDelta.deleted) {
      accounts.splice(accountIdx, 1); // deleted account
    } else {
      accounts.splice(accountIdx, 1, accountDelta); // update existing account
    }
  }
  return accounts;
}

const getNDaysAgoISO = (days: number) => {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().substring(0, 10);
};

/** Check for new unapproved transactions in this budget  */
export async function checkUnapprovedTxsForBudget(ynabAPI: api, budgetId: string) {
  const {
    data: { transactions }
  } = await ynabAPI.transactions.getTransactions(
    budgetId,
    getNDaysAgoISO(14), // fetch unapproved transactions from up to 2 weeks ago
    GetTransactionsTypeEnum.Unapproved
  );
  IS_DEV && console.log("Checked for new imports!", transactions);
  return transactions;
}
