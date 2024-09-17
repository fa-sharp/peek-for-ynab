import { GetTransactionsTypeEnum, type api } from "ynab";

import { IS_DEV } from "./constants";

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

/** Fetch category groups for this budget from the YNAB API */
export async function fetchCategoryGroupsForBudget(
  ynabAPI: api,
  selectedBudgetId: string
) {
  const response = await ynabAPI.categories.getCategories(selectedBudgetId);
  const categoryGroups = response.data.category_groups.filter(
    (group) => !group.hidden // filter out hidden groups
  );
  categoryGroups.forEach(
    // filter out hidden categories
    (group) => (group.categories = group.categories.filter((c) => !c.hidden))
  );
  IS_DEV && console.log("Fetched categories!", categoryGroups);
  return categoryGroups;
}

/** Fetch accounts for this budget from the YNAB API */
export async function fetchAccountsForBudget(ynabAPI: api, selectedBudgetId: string) {
  const response = await ynabAPI.accounts.getAccounts(selectedBudgetId);
  const accounts = response.data.accounts
    .filter((a) => a.closed === false) // filter out closed accounts
    .sort((a, b) =>
      a.on_budget && !b.on_budget ? -1 : !a.on_budget && b.on_budget ? 1 : 0
    ); // sort with Budget accounts first
  IS_DEV && console.log("Fetched accounts!", accounts);
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
