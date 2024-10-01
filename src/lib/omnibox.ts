import type { Account, Category, CategoryGroupWithCategories } from "ynab";

import {
  CHROME_LOCAL_STORAGE,
  CHROME_SYNC_STORAGE,
  ONE_DAY_IN_MILLIS
} from "./constants";
import { createQueryClient } from "./queryClient";
import type { AppSettings, CachedBudget, CachedPayee } from "./types";
import {
  formatCurrency,
  getIgnoredCategoryIdsForTx,
  parseLocaleNumber,
  searchWithinString,
  stringValueToMillis
} from "./utils";

interface CachedBudgetData {
  payeesData?: CachedPayee[];
  categoriesData?: Category[];
  accountsData?: Account[];
}

interface ParsedQuery {
  amount: string;
  memo: string;
  lastParsedIdx: number;
  budgetQuery?: string;
}

export interface ParsedTxQuery extends ParsedQuery {
  type: "tx";
  payeeQuery?: string;
  categoryQuery?: string;
  accountQuery?: string;
}

export interface ParsedTxResults {
  payeeResults: CachedPayee[];
  categoryResults: Category[];
  accountResults: Account[];
}

export interface ParsedTransferQuery extends ParsedQuery {
  type: "transfer";
  fromAccountQuery?: string;
  toAccountQuery?: string;
  categoryQuery?: string;
}

export interface ParsedTransferResults {
  fromAccountResults: Account[];
  toAccountResults: Account[];
  categoryResults: Category[];
}

export function parseTxInput(text: string): ParsedTxQuery | ParsedTransferQuery | null {
  const dataToParse = text.split(/\s+/);
  if (dataToParse.length === 0) return null;

  if (dataToParse[0] === "add") {
    /** [amount, budget, payee, category, account, memo] */
    const parsedData: string[] = ["", "", "", "", "", ""];
    let parsedIdx = 0;
    for (const word of dataToParse.slice(1)) {
      if (word === "in" && parsedIdx < 1) parsedIdx = 1;
      else if (word === "at" && parsedIdx < 2) parsedIdx = 2;
      else if (word === "for" && parsedIdx < 3) parsedIdx = 3;
      else if (word === "on" && parsedIdx < 4) parsedIdx = 4;
      else if (word === "memo" && parsedIdx < 5) parsedIdx = 5;
      else if (parsedIdx === 0) {
        const parsedAmount = parseLocaleNumber(word);
        if (!isNaN(parsedAmount)) parsedData[0] = parsedAmount.toString();
      } else parsedData[parsedIdx] += word + " ";
    }
    const [amount, budgetQuery, payeeQuery, categoryQuery, accountQuery, memo] =
      parsedData;
    return {
      type: "tx",
      budgetQuery,
      amount,
      payeeQuery,
      categoryQuery,
      accountQuery,
      memo,
      lastParsedIdx: parsedIdx
    };
  } else if (dataToParse[0] === "transfer") {
    /** [amount, budget, account 1, account 2, category, memo] */
    const parsedData: string[] = ["", "", "", "", "", ""];
    let account1Direction: "from" | "to" = "from";
    let parsedIdx = 0;
    for (const word of dataToParse.slice(1)) {
      if (word === "in" && parsedIdx < 1) parsedIdx = 1;
      else if ((word === "from" || word === "to") && parsedIdx < 2) {
        if (word === "to") account1Direction = "to";
        parsedIdx = 2;
      } else if ((word === "from" || word === "to") && parsedIdx < 3) parsedIdx = 3;
      else if (word === "for" && parsedIdx < 4) parsedIdx = 4;
      else if (word === "memo" && parsedIdx < 5) parsedIdx = 5;
      else if (parsedIdx === 0) {
        const parsedAmount = parseLocaleNumber(word);
        if (!isNaN(parsedAmount)) parsedData[0] = parsedAmount.toString();
      } else parsedData[parsedIdx] += word + " ";
    }
    const [amount, budget, account1, account2, category, memo] = parsedData;
    return {
      type: "transfer",
      amount,
      budgetQuery: budget,
      fromAccountQuery: account1Direction === "from" ? account1 : account2,
      toAccountQuery: account1Direction === "from" ? account2 : account1,
      categoryQuery: category,
      memo,
      lastParsedIdx: parsedIdx
    };
  }
  return null;
}

export const getPossibleTxFields = (
  parsed: ParsedTxQuery,
  data: CachedBudgetData,
  ignoredCategoryIds?: Set<string>
): ParsedTxResults => ({
  payeeResults:
    parsed.payeeQuery && data.payeesData
      ? data.payeesData
          .filter((p) => searchWithinString(p.name, parsed.payeeQuery!.trim()))
          .slice(0, 5)
      : [],
  categoryResults:
    parsed.categoryQuery && data.categoriesData
      ? data.categoriesData
          .filter((c) => !ignoredCategoryIds?.has(c.id))
          .filter((c) => searchWithinString(c.name, parsed.categoryQuery!.trim()))
          .slice(0, 5)
      : [],
  accountResults:
    parsed.accountQuery && data.accountsData
      ? data.accountsData
          .filter((a) => searchWithinString(a.name, parsed.accountQuery!.trim()))
          .slice(0, 5)
      : []
});

export function getPossibleTxFieldCombinations(
  parsed: ParsedTxQuery,
  data: CachedBudgetData
) {
  const { payeeResults, categoryResults, accountResults } = getPossibleTxFields(
    parsed,
    data
  );

  let txCombinations: Array<{
    payee?: CachedPayee;
    account?: Account;
    category?: Category;
  }> = payeeResults.map((payee) => ({ payee }));

  if (txCombinations.length === 0)
    categoryResults.forEach((category) => txCombinations.push({ category }));
  else if (categoryResults.length > 0)
    txCombinations = categoryResults.flatMap((category) =>
      txCombinations.map((fields) => ({ ...fields, category }))
    );
  if (txCombinations.length === 0)
    accountResults.forEach((account) => txCombinations.push({ account }));
  else if (accountResults.length > 0)
    txCombinations = accountResults.flatMap((account) =>
      txCombinations.map((fields) => ({ ...fields, account }))
    );

  return txCombinations;
}

export const getPossibleTransferFields = (
  parsed: ParsedTransferQuery,
  data: CachedBudgetData,
  ignoredCategoryIds?: Set<string>
): ParsedTransferResults => ({
  fromAccountResults:
    parsed.fromAccountQuery && data.accountsData
      ? data.accountsData
          .filter((a) => searchWithinString(a.name, parsed.fromAccountQuery!.trim()))
          .slice(0, 5)
      : [],
  toAccountResults:
    parsed.toAccountQuery && data.accountsData
      ? data.accountsData
          .filter((a) => searchWithinString(a.name, parsed.toAccountQuery!.trim()))
          .slice(0, 5)
      : [],
  categoryResults:
    parsed.categoryQuery && data.categoriesData
      ? data.categoriesData
          .filter((c) => !ignoredCategoryIds?.has(c.id))
          .filter((c) => searchWithinString(c.name, parsed.categoryQuery!.trim()))
          .slice(0, 5)
      : []
});

export function getPossibleTransferFieldCombinations(
  parsed: ParsedTransferQuery,
  data: CachedBudgetData
) {
  const { fromAccountResults, toAccountResults, categoryResults } =
    getPossibleTransferFields(parsed, data);

  let txCombinations: {
    payee?: CachedPayee;
    account?: Account;
    category?: Category;
  }[] = toAccountResults
    .filter((a) => !!a.transfer_payee_id)
    .map((account) => ({
      payee: {
        id: account.transfer_payee_id!,
        name: account.name,
        transferId: account.id
      }
    }));
  if (txCombinations.length === 0)
    fromAccountResults.forEach((account) => txCombinations.push({ account }));
  else if (fromAccountResults.length > 0)
    txCombinations = fromAccountResults.flatMap((account) =>
      txCombinations.map((fields) => ({ ...fields, account }))
    );
  if (txCombinations.length === 0)
    categoryResults.forEach((category) => txCombinations.push({ category }));
  else if (categoryResults.length > 0)
    txCombinations = categoryResults.flatMap((category) =>
      txCombinations.map((fields) => ({ ...fields, category }))
    );

  return txCombinations;
}

/** Check if user has enabled permission to use the URL/address bar */
export async function checkBrowserBarPermission() {
  const sync = await CHROME_LOCAL_STORAGE.get<boolean>("sync");
  const settings = await (
    sync ? CHROME_SYNC_STORAGE : CHROME_LOCAL_STORAGE
  ).get<AppSettings>("settings");
  return !!settings?.omnibox;
}

export function createBrowserBarSuggestions(
  type: "tx" | "transfer",
  possibleTxFields: {
    payee?: CachedPayee;
    account?: Account;
    category?: Category;
  }[],
  budget?: CachedBudget,
  amount?: string,
  memo?: string
): chrome.omnibox.SuggestResult[] {
  return possibleTxFields.map(({ payee, category, account }) => ({
    content:
      type === "tx"
        ? "add " +
          (amount ? amount : "") +
          (budget ? ` in ${budget.name}` : "") +
          (payee ? ` at ${payee.name}` : "") +
          (category ? ` for ${category.name}` : "") +
          (account ? ` on ${account.name}` : "") +
          (memo ? ` memo ${memo}` : "")
        : "transfer " +
          (amount ? amount : "") +
          (budget ? ` in ${budget.name}` : "") +
          (account ? ` from ${account.name}` : "") +
          (payee ? ` to ${payee.name}` : "") +
          (category ? ` for ${category.name}` : "") +
          (memo ? ` memo ${memo}` : ""),
    description:
      type === "tx"
        ? "add: " +
          (amount
            ? formatCurrency(
                stringValueToMillis(amount, "Outflow"),
                budget?.currencyFormat
              )
            : "") +
          (budget ? ` in ${escapeXML(budget.name)}` : "") +
          (payee ? ` at <match>${escapeXML(payee.name)}</match>` : "") +
          (category ? ` for <match>${escapeXML(category.name)}</match>` : "") +
          (account ? ` on <match>${escapeXML(account.name)}</match>` : "") +
          (memo ? ` memo <match>${escapeXML(memo)}</match>` : "")
        : "transfer: " +
          (amount
            ? formatCurrency(
                stringValueToMillis(amount, "Inflow"),
                budget?.currencyFormat
              )
            : "") +
          (budget ? ` in ${escapeXML(budget.name)}` : "") +
          (account ? ` from <match>${escapeXML(account.name)}</match>` : "") +
          (payee ? ` to <match>${escapeXML(payee.name)}</match>` : "") +
          (category ? ` for <match>${escapeXML(category.name)}</match>` : "") +
          (memo ? ` memo <match>${escapeXML(memo)}</match>` : "")
  }));
}

const xmlEscapedChars: Record<string, string> = {
  '"': "&quot;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;"
};

function escapeXML(s: string) {
  let escaped = "";
  for (const c of s) {
    escaped += xmlEscapedChars[c] || c;
  }
  return escaped;
}

const browserBarCache: {
  budgets?: CachedBudget[];
  data: {
    [budgetId: string]: {
      payeesData?: CachedPayee[];
      categoriesData?: Category[];
      accountsData?: Account[];
    };
  };
} = { data: {} };

export async function getBrowserBarBudgets() {
  if (browserBarCache.budgets) return browserBarCache.budgets;

  const queryClient = createQueryClient({
    staleTime: ONE_DAY_IN_MILLIS * 7
  });
  const storage = (await CHROME_LOCAL_STORAGE.get<boolean>("sync"))
    ? CHROME_SYNC_STORAGE
    : CHROME_LOCAL_STORAGE;
  const budgetIdsToShow = await storage.get<string[]>("budgets");
  const budgets = (
    await queryClient.fetchQuery<CachedBudget[]>({
      queryKey: ["budgets"],
      queryFn: () => []
    })
  ).filter((b) => budgetIdsToShow?.includes(b.id));
  browserBarCache.budgets = budgets;
  return budgets;
}

export async function getBrowserBarDataForBudget(budgetId: string) {
  if (browserBarCache.data[budgetId]) return browserBarCache.data[budgetId];

  const budgetCache: (typeof browserBarCache)["data"][string] = {};
  const queryClient = createQueryClient({
    staleTime: ONE_DAY_IN_MILLIS * 7
  });
  const [{ payees }, { categoryGroups }, { accounts }] = await Promise.all([
    queryClient.fetchQuery<{ payees: CachedPayee[] }>({
      queryKey: ["payees", { budgetId }],
      queryFn: () => ({ payees: [] })
    }),
    queryClient.fetchQuery<{
      categoryGroups: CategoryGroupWithCategories[];
    }>({
      queryKey: ["categoryGroups", { budgetId }],
      queryFn: () => ({ categoryGroups: [] })
    }),
    queryClient.fetchQuery<{
      accounts: Account[];
    }>({
      queryKey: ["accounts", { budgetId }],
      queryFn: () => ({ accounts: [] })
    })
  ]);

  budgetCache.payeesData = payees;
  budgetCache.accountsData = accounts;

  const ignoredCategoryIds = getIgnoredCategoryIdsForTx(categoryGroups);
  const categories = categoryGroups
    .flatMap((cg) => cg.categories)
    .filter((c) => !ignoredCategoryIds.has(c.id));
  budgetCache.categoriesData = categories;

  browserBarCache.data[budgetId] = budgetCache;
  return budgetCache;
}
