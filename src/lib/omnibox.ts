import type { Account, Category, CategoryGroupWithCategories } from "ynab";

import type { CachedPayee } from "./context/ynabContext";
import { createQueryClient } from "./queryClient";
import {
  ONE_DAY_IN_MILLIS,
  formatCurrency,
  parseLocaleNumber,
  searchWithinString,
  stringValueToMillis
} from "./utils";

export function parseTxInput(text: string): {
  amount?: string;
  payeeQuery?: string;
  categoryQuery?: string;
  accountQuery?: string;
  memo?: string;
} {
  const dataToParse = text.split(/\s+/);
  if (dataToParse.length === 0) return {};

  /** [amount, payee, category, account, memo] */
  const parsedData: [string, string, string, string, string] = ["", "", "", "", ""];
  let parsedIdx = 0;
  for (const word of dataToParse) {
    if (word === "at" && parsedIdx < 1) parsedIdx = 1;
    else if (word === "for" && parsedIdx < 2) parsedIdx = 2;
    else if (word === "on" && parsedIdx < 3) parsedIdx = 3;
    else if (word === "memo" && parsedIdx < 4) parsedIdx = 4;
    else if (parsedIdx === 0) {
      const parsedAmount = parseLocaleNumber(word);
      if (!isNaN(parsedAmount)) parsedData[0] = parsedAmount.toString();
    } else parsedData[parsedIdx] += word + " ";
  }
  const [amount, payeeQuery, categoryQuery, accountQuery, memo] = parsedData;
  return { amount, payeeQuery, categoryQuery, accountQuery, memo };
}

export function getPossibleTxFieldsFromParsedInput(
  parsed: {
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
  let payeeResults: CachedPayee[] = [];
  let categoryResults: Category[] = [];
  let accountResults: Account[] = [];
  if (parsed.payeeQuery) {
    payeeResults =
      data.payees
        ?.filter((p) => searchWithinString(p.name, parsed.payeeQuery!.trim()))
        .slice(0, 5) || [];
  }
  if (parsed.categoryQuery) {
    categoryResults =
      data.categories
        ?.filter((c) => searchWithinString(c.name, parsed.categoryQuery!.trim()))
        .slice(0, 5) || [];
  }
  if (parsed.accountQuery) {
    accountResults =
      data.accounts
        ?.filter((a) => searchWithinString(a.name, parsed.accountQuery!.trim()))
        .slice(0, 5) || [];
  }

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

export function createOmniboxSuggestions(
  possibleTxFields: {
    payee?: CachedPayee;
    account?: Account;
    category?: Category;
  }[],
  amount?: string,
  memo?: string
): chrome.omnibox.SuggestResult[] {
  return possibleTxFields.map(({ payee, category, account }) => ({
    content: JSON.stringify({
      amount,
      payee,
      accountId: account?.id,
      categoryId: category?.id,
      memo: memo?.trim()
    }),
    description:
      "transaction: " +
      (amount ? formatCurrency(stringValueToMillis(amount, "Outflow")) : "") +
      (payee ? ` at <match>${escapeXML(payee.name)}</match>` : "") +
      (category ? ` for <match>${escapeXML(category.name)}</match>` : "") +
      (account ? ` on <match>${escapeXML(account.name)}</match>` : "") +
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
  [budgetId: string]: {
    payees?: CachedPayee[];
    categories?: Category[];
    accounts?: Account[];
  };
} = {};

export async function getOmniboxCache(budgetId: string) {
  if (omniboxCache[budgetId]) return omniboxCache[budgetId];

  const budgetCache: (typeof omniboxCache)[string] = {};
  const queryClient = createQueryClient({
    staleTime: ONE_DAY_IN_MILLIS * 7
  });
  const { payees } = await queryClient.fetchQuery<{ payees: CachedPayee[] }>({
    queryKey: ["payees", { budgetId }],
    queryFn: () => ({ payees: [] })
  });
  budgetCache.payees = payees;
  const { categoryGroups } = await queryClient.fetchQuery<{
    categoryGroups: CategoryGroupWithCategories[];
  }>({
    queryKey: ["categoryGroups", { budgetId }],
    queryFn: () => ({ categoryGroups: [] })
  });
  categoryGroups.splice(1, 1); // CCP
  const categories = categoryGroups.flatMap((cg) => cg.categories);
  categories.splice(1, 2); // Internal master, deferred
  budgetCache.categories = categories;
  const { accounts } = await queryClient.fetchQuery<{
    accounts: Account[];
  }>({
    queryKey: ["accounts", { budgetId }],
    queryFn: () => ({ accounts: [] })
  });
  budgetCache.accounts = accounts;

  omniboxCache[budgetId] = budgetCache;
  return budgetCache;
}
