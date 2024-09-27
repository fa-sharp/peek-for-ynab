import type { Account, Category } from "ynab";

import type { CachedPayee } from "./context/ynabContext";
import { parseLocaleNumber, searchWithinString } from "./utils";

export function parseTxInput(text: string): {
  amount?: string;
  payeeQuery?: string;
  categoryQuery?: string;
  accountQuery?: string;
  memo?: string;
} {
  const dataToParse = text.split(/\W+/);
  if (dataToParse.length === 0) return {};

  /** amount, payee, category, account, memo */
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

  let possibleTxs: { payee?: CachedPayee; account?: Account; category?: Category }[] = [];

  for (const payee of payeeResults) {
    possibleTxs.push({ payee });
  }
  if (possibleTxs.length === 0)
    categoryResults.forEach((category) => possibleTxs.push({ category }));
  else if (categoryResults.length > 0) {
    possibleTxs = categoryResults.flatMap((category) =>
      possibleTxs.map((fields) => ({ ...fields, category }))
    );
  }
  if (possibleTxs.length === 0)
    accountResults.forEach((account) => possibleTxs.push({ account }));
  else if (accountResults.length > 0) {
    possibleTxs = accountResults.flatMap((account) =>
      possibleTxs.map((fields) => ({ ...fields, account }))
    );
  }

  return possibleTxs;
}
