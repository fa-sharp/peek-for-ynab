import type { Account, Category, CategoryGroupWithCategories } from "ynab";

import { Storage } from "@plasmohq/storage";

import type { AppSettings } from "./context/storageContext";
import type { CachedPayee } from "./context/ynabContext";
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
      payeeQuery?: string;
      categoryQuery?: string;
      accountQuery?: string;
      memo?: string;
    }
  | {
      type: "transfer";
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
    /** [amount, payee, category, account, memo] */
    const parsedData: [string, string, string, string, string] = ["", "", "", "", ""];
    let parsedIdx = 0;
    for (const word of dataToParse.slice(1)) {
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
    return { type: "tx", amount, payeeQuery, categoryQuery, accountQuery, memo };
  } else if (dataToParse[0] === "transfer") {
    /** [amount, account 1, account 2, category, memo] */
    const parsedData: [string, string, string, string, string] = ["", "", "", "", ""];
    let account1Direction: "from" | "to" = "from";
    let parsedIdx = 0;
    for (const word of dataToParse.slice(1)) {
      if ((word === "from" || word === "to") && parsedIdx < 1) {
        if (word === "to") account1Direction = "to";
        parsedIdx = 1;
      } else if ((word === "from" || word === "to") && parsedIdx < 2) parsedIdx = 2;
      else if (word === "for" && parsedIdx < 3) parsedIdx = 3;
      else if (word === "memo" && parsedIdx < 4) parsedIdx = 4;
      else if (parsedIdx === 0) {
        const parsedAmount = parseLocaleNumber(word);
        if (!isNaN(parsedAmount)) parsedData[0] = parsedAmount.toString();
      } else parsedData[parsedIdx] += word + " ";
    }
    const [amount, account1, account2, category, memo] = parsedData;
    return {
      type: "transfer",
      amount,
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
  amount?: string,
  memo?: string
): chrome.omnibox.SuggestResult[] {
  return possibleTxFields.map(({ payee, category, account }) => ({
    content:
      type === "tx"
        ? "add " +
          (amount ? amount : "") +
          (payee ? ` at ${payee.name}` : "") +
          (category ? ` for ${category.name}` : "") +
          (account ? ` on ${account.name}` : "") +
          (memo ? ` memo ${memo}` : "")
        : "transfer " +
          (amount ? amount : "") +
          (account ? ` from ${account.name}` : "") +
          (payee ? ` to ${payee.name}` : "") +
          (category ? ` for ${category.name}` : "") +
          (memo ? ` memo ${memo}` : ""),
    description:
      type === "tx"
        ? "add: " +
          (amount ? formatCurrency(stringValueToMillis(amount, "Outflow")) : "") +
          (payee ? ` at <match>${escapeXML(payee.name)}</match>` : "") +
          (category ? ` for <match>${escapeXML(category.name)}</match>` : "") +
          (account ? ` on <match>${escapeXML(account.name)}</match>` : "") +
          (memo ? ` memo <match>${escapeXML(memo)}</match>` : "")
        : "transfer: " +
          (amount ? formatCurrency(stringValueToMillis(amount, "Inflow")) : "") +
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

  omniboxCache[budgetId] = budgetCache;
  return budgetCache;
}
