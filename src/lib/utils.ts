import * as ynab from "ynab";

const currencyFormatterCache = new Map<string, (millis: number) => string>();

export const getCurrencyFormatter = (
  /** the budget's `currency_format` property from YNAB */
  currencyFormat = { iso_code: "USD", decimal_digits: 2 }
) => {
  const formatterKey = currencyFormat.iso_code + currencyFormat.decimal_digits;
  const cachedFormatter = currencyFormatterCache.get(formatterKey);
  if (cachedFormatter) return cachedFormatter;

  const numberFormat = new Intl.NumberFormat("default", {
    style: "currency",
    currency: currencyFormat.iso_code,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currencyFormat.decimal_digits
  });
  const newFormatter = (millis: number) => {
    const currencyAmount = ynab.utils.convertMilliUnitsToCurrencyAmount(
      millis,
      currencyFormat.decimal_digits
    );
    return numberFormat.format(currencyAmount);
  };
  currencyFormatterCache.set(formatterKey, newFormatter);

  return newFormatter;
};

export const formatCurrency = (
  millis: number,
  /** the budget's `currency_format` property from YNAB */
  currencyFormat = { iso_code: "USD", decimal_digits: 2 }
) => getCurrencyFormatter(currencyFormat)(millis);

/** Convert millis to a string value suitable for the HTML number input */
export const millisToStringValue = (
  millis: number,
  currencyFormat = { decimal_digits: 2 }
) => (millis / 1000).toFixed(currencyFormat.decimal_digits ?? 2);

/** Convert a string value (e.g. from HTML number input) to milliUnits */
export const stringValueToMillis = (value: string, type: "Inflow" | "Outflow") =>
  type === "Outflow" ? Math.round(+value * -1000) : Math.round(+value * 1000);

export const isEmptyObject = (objectName: object) => {
  for (const prop in objectName) {
    if (Object.prototype.hasOwnProperty.call(objectName, prop)) {
      return false;
    }
  }
  return true;
};

export const findCCAccount = (accountsData: ynab.Account[], name: string) =>
  accountsData?.find(
    (a) => (a.type === "creditCard" || a.type === "lineOfCredit") && a.name === name
  );

/** Ignored category IDs when adding a transaction (Deferred Income, CCP categories) */
export const getIgnoredCategoryIdsForTx = (data: ynab.CategoryGroupWithCategories[]) => {
  const ignoredIds = new Set(
    data.slice(0, 2).flatMap((cg) => cg.categories.map((c) => c.id))
  );
  ignoredIds.delete(data[0]?.categories[0]?.id); // Don't ignore Inflow: RTA category
  return ignoredIds;
};

/** Check if a search query is contained in a string, in the context of searching (i.e. ignore case) */
export const searchWithinString = (str: string, query: string) =>
  str.toLocaleLowerCase().includes(query.toLocaleLowerCase());

/**
 * Get today's date (user's local timezone) in ISO format (i.e. for `input[type=date]` element)
 */
export const getTodaysDateISO = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().substring(0, 10);
};

const dateFormatter = new Intl.DateTimeFormat("default", {
  month: "numeric",
  day: "numeric",
  timeZone: "UTC"
});

const dateFormatterWithYear = new Intl.DateTimeFormat("default", {
  month: "numeric",
  day: "numeric",
  year: "2-digit",
  timeZone: "UTC"
});

/** Format a date with just the month and day. If not in the current year, include the year. */
export const formatDateMonthAndDay = (date: Date) => {
  if (date.getUTCFullYear() === new Date().getUTCFullYear())
    return dateFormatter.format(date);
  else return dateFormatterWithYear.format(date);
};

/** Parse decimal number according to user's locale. Shamelessly copied from https://stackoverflow.com/a/45309230 */
export const parseLocaleNumber = (value: string, locales = navigator.languages) => {
  const example = Intl.NumberFormat(locales).format(1.1);
  const cleanPattern = new RegExp(`[^-+0-9${example.charAt(1)}]`, "g");
  const cleaned = value.replace(cleanPattern, "");
  const normalized = cleaned.replace(example.charAt(1), ".");

  return parseFloat(normalized);
};

const emojiRegex =
  // eslint-disable-next-line no-misleading-character-class
  /[\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{200d}\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}]+/gu;

/** Returns the emojis found in a string */
export const findEmoji = (s: string, limit = 2) => {
  const matches = s.match(emojiRegex);
  return matches ? matches.slice(0, limit).join("") : null;
};

export const findAllEmoji = (s: string): string[] => {
  return s.match(emojiRegex) || [];
};

/**
 * Executes the given function in the context of the user's active browser tab.
 * @returns a Promise with the result of the given function
 * @throws any errors that arise, including browser permission errors.
 */
export const executeScriptInCurrentTab = async <T>(func: () => T) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) throw new Error("Couldn't identify open tab.");
  const [{ result }] = await chrome.scripting.executeScript({
    func,
    target: { tabId: tab.id }
  });
  return result as T;
};

type OptionalPermissions = "activeTab" | "scripting" | "notifications";

/**
 * Request optional permissions. Use 'activeTab' and 'scripting' to access the current tab and execute scripts within it.
 * Use 'notifications' to enable native desktop notifications.
 */
export const requestPermissions = (permissions: OptionalPermissions[]) =>
  new Promise<boolean>((resolve) => {
    chrome.permissions.request({ permissions }, (granted) => {
      if (granted) resolve(true);
      else {
        console.error("Permission denied:", chrome.runtime.lastError);
        resolve(false);
      }
    });
  });

/** Check if optional permissions exist */
export const checkPermissions = (permissions: OptionalPermissions[]) =>
  new Promise<boolean>((resolve) => {
    chrome.permissions.contains({ permissions }, (granted) => {
      resolve(granted);
    });
  });

/** Remove optional permissions. */
export const removePermissions = (permissions: OptionalPermissions[]) =>
  new Promise<boolean>((resolve) =>
    chrome.permissions.remove({ permissions }, (removed) => {
      if (removed) resolve(true);
      else {
        console.error("Error removing permissions:", chrome.runtime.lastError);
        resolve(false);
      }
    })
  );

export const flagColorToEmoji = (flagColor: ynab.TransactionFlagColor | string) => {
  if (flagColor === ynab.TransactionFlagColor.Blue) return "🔵";
  if (flagColor === ynab.TransactionFlagColor.Green) return "🟢";
  if (flagColor === ynab.TransactionFlagColor.Orange) return "🟠";
  if (flagColor === ynab.TransactionFlagColor.Purple) return "🟣";
  if (flagColor === ynab.TransactionFlagColor.Red) return "🔴";
  if (flagColor === ynab.TransactionFlagColor.Yellow) return "🟡";
  return null;
};
