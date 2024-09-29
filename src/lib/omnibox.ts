import type { Account, Category, CategoryGroupWithCategories } from "ynab";

import { Storage } from "@plasmohq/storage";

import type { AppSettings } from "./context/storageContext";
import type { CachedBudget, CachedPayee } from "./context/ynabContext";
import { createQueryClient } from "./queryClient";
import {
  ONE_DAY_IN_MILLIS,
  formatCurrency,
  parseLocaleNumber,
  searchWithinString,
  stringValueToMillis
} from "./utils";

export function parseTxInput(text: string):
  | {
      type: "tx";
      amount?: string;
      budgetQuery?: string;
      payeeQuery?: string;
      categoryQuery?: string;
      accountQuery?: string;
      memo?: string;
    }
  | {
      type: "transfer";
      budgetQuery?: string;
      fromAccountQuery?: string;
      toAccountQuery?: string;
      categoryQuery?: string;
      amount?: string;
      memo?: string;
    }
  | null {
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
      memo
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
      memo
    };
  }
  return null;
}

export function getPossibleTxFieldsFromParsedInput(
  parsed: {
    budgetQuery?: string;
    payeeQuery?: string;
    categoryQuery?: string;
    accountQuery?: string;
  },
  data: {
    payees?: CachedPayee[];
    categories?: Category[];
    accounts?: Account[];
  }
) {
  const payeeResults: CachedPayee[] = parsed.payeeQuery
    ? data.payees
        ?.filter((p) => searchWithinString(p.name, parsed.payeeQuery!.trim()))
        .slice(0, 5) || []
    : [];
  const categoryResults: Category[] = parsed.categoryQuery
    ? data.categories
        ?.filter((c) => searchWithinString(c.name, parsed.categoryQuery!.trim()))
        .slice(0, 5) || []
    : [];
  const accountResults: Account[] = parsed.accountQuery
    ? data.accounts
        ?.filter((a) => searchWithinString(a.name, parsed.accountQuery!.trim()))
        .slice(0, 5) || []
    : [];

  let possibleTxFields: {
    payee?: CachedPayee;
    account?: Account;
    category?: Category;
  }[] = [];

  for (const payee of payeeResults) {
    possibleTxFields.push({ payee });
  }
  if (possibleTxFields.length === 0)
    categoryResults.forEach((category) => possibleTxFields.push({ category }));
  else if (categoryResults.length > 0) {
    possibleTxFields = categoryResults.flatMap((category) =>
      possibleTxFields.map((fields) => ({ ...fields, category }))
    );
  }
  if (possibleTxFields.length === 0)
    accountResults.forEach((account) => possibleTxFields.push({ account }));
  else if (accountResults.length > 0) {
    possibleTxFields = accountResults.flatMap((account) =>
      possibleTxFields.map((fields) => ({ ...fields, account }))
    );
  }

  return possibleTxFields;
}

export function getPossibleTransferFieldsFromParsedInput(
  parsed: {
    fromAccountQuery?: string;
    toAccountQuery?: string;
    categoryQuery?: string;
  },
  data: {
    categories?: Category[];
    accounts?: Account[];
  }
) {
  const fromAccountResults: Account[] = parsed.fromAccountQuery
    ? data.accounts
        ?.filter((a) => searchWithinString(a.name, parsed.fromAccountQuery!.trim()))
        .slice(0, 5) || []
    : [];
  const toAccountResults: Account[] = parsed.toAccountQuery
    ? data.accounts
        ?.filter((a) => searchWithinString(a.name, parsed.toAccountQuery!.trim()))
        .slice(0, 5) || []
    : [];
  const categoryResults: Category[] = parsed.categoryQuery
    ? data.categories
        ?.filter((c) => searchWithinString(c.name, parsed.categoryQuery!.trim()))
        .slice(0, 5) || []
    : [];

  let possibleTxFields: {
    payee?: CachedPayee;
    account?: Account;
    category?: Category;
  }[] = [];

  for (const account of toAccountResults) {
    account.transfer_payee_id &&
      possibleTxFields.push({
        payee: {
          id: account.transfer_payee_id,
          name: account.name,
          transferId: account.id
        }
      });
  }
  if (possibleTxFields.length === 0)
    fromAccountResults.forEach((account) => possibleTxFields.push({ account }));
  else if (fromAccountResults.length > 0) {
    possibleTxFields = fromAccountResults.flatMap((account) =>
      possibleTxFields.map((fields) => ({ ...fields, account }))
    );
  }
  if (possibleTxFields.length === 0)
    categoryResults.forEach((category) => possibleTxFields.push({ category }));
  else if (categoryResults.length > 0) {
    possibleTxFields = categoryResults.flatMap((category) =>
      possibleTxFields.map((fields) => ({ ...fields, category }))
    );
  }

  return possibleTxFields;
}

const chromeLocalStorage = new Storage({ area: "local" });
const chromeSyncStorage = new Storage({ area: "sync" });
export async function checkOmniboxPermission() {
  const sync = await chromeLocalStorage.get<boolean>("sync");
  const settings = await (sync ? chromeSyncStorage : chromeLocalStorage).get<AppSettings>(
    "settings"
  );
  return !!settings?.omnibox;
}

export function createOmniboxSuggestions(
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
          (amount ? formatCurrency(stringValueToMillis(amount, "Outflow")) : "") +
          (budget ? ` in ${escapeXML(budget.name)}` : "") +
          (payee ? ` at <match>${escapeXML(payee.name)}</match>` : "") +
          (category ? ` for <match>${escapeXML(category.name)}</match>` : "") +
          (account ? ` on <match>${escapeXML(account.name)}</match>` : "") +
          (memo ? ` memo <match>${escapeXML(memo)}</match>` : "")
        : "transfer: " +
          (amount ? formatCurrency(stringValueToMillis(amount, "Inflow")) : "") +
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

const omniboxCache: {
  budgets?: CachedBudget[];
  data: {
    [budgetId: string]: {
      payees?: CachedPayee[];
      categories?: Category[];
      accounts?: Account[];
    };
  };
} = { data: {} };

export async function getOmniboxBudgets() {
  if (omniboxCache.budgets) return omniboxCache.budgets;

  const queryClient = createQueryClient({
    staleTime: ONE_DAY_IN_MILLIS * 7
  });
  const storage = (await chromeLocalStorage.get<boolean>("sync"))
    ? chromeSyncStorage
    : chromeLocalStorage;
  const budgetIdsToShow = await storage.get<string[]>("budgets");
  const budgets = (
    await queryClient.fetchQuery<CachedBudget[]>({
      queryKey: ["budgets"],
      queryFn: () => []
    })
  ).filter((b) => budgetIdsToShow?.includes(b.id));
  omniboxCache.budgets = budgets;
  return budgets;
}

export async function getOmniboxCacheForBudget(budgetId: string) {
  if (omniboxCache.data[budgetId]) return omniboxCache.data[budgetId];

  const budgetCache: (typeof omniboxCache)["data"][string] = {};
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

  budgetCache.payees = payees;
  budgetCache.accounts = accounts;

  categoryGroups.splice(1, 1); // CCP categories
  const categories = categoryGroups.flatMap((cg) => cg.categories);
  categories.splice(1, 2); // Internal master, deferred income categories
  budgetCache.categories = categories;

  omniboxCache.data[budgetId] = budgetCache;
  return budgetCache;
}
