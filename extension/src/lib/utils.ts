import { browser } from "#imports";
import type {
  Account,
  CategoryGroupWithCategories,
  TransactionFlagColor,
} from "./api/client";
import type { CachedPayee } from "./types";

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
    minimumFractionDigits: currencyFormat.decimal_digits,
  });
  const newFormatter = (millis: number) => {
    const currencyAmount = convertMilliUnitsToCurrencyAmount(
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
    if (Object.hasOwn(objectName, prop)) {
      return false;
    }
  }
  return true;
};

export const findCCAccount = (accountsData: Account[], name: string) =>
  accountsData?.find(
    (a) => (a.type === "creditCard" || a.type === "lineOfCredit") && a.name === name
  );

/**
 * Determine whether a transaction is transferring from a budget account to a tracking account.
 * These transactions should have categories.
 */
export const isBudgetToTrackingTransfer = (
  payee?: CachedPayee | {} | null,
  account?: Account,
  allAccounts?: Account[]
) => {
  if (!payee || !("id" in payee) || !payee.transferId) return false;
  const transferToAccount = allAccounts?.find(
    (a) => payee && "transferId" in payee && a.id === payee.transferId
  );
  if (!transferToAccount) return false;
  return !transferToAccount.on_budget && !!account?.on_budget;
};

/** Ignored category IDs when adding a transaction (Deferred Income, CCP categories) */
export const getIgnoredCategoryIdsForTx = (
  data: CategoryGroupWithCategories[],
  ignoreRta = false
) => {
  const ignoredIds = new Set(
    data.slice(0, 2).flatMap((cg) => cg.categories.map((c) => c.id))
  );
  if (!ignoreRta) ignoredIds.delete(data[0]?.categories[0]?.id);
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

export const getNDaysAgoISO = (days: number) => {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().substring(0, 10);
};

const dateFormatter = new Intl.DateTimeFormat("default", {
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

const dateFormatterWithYear = new Intl.DateTimeFormat("default", {
  month: "numeric",
  day: "numeric",
  year: "2-digit",
  timeZone: "UTC",
});

/** Format a date with just the month and day. If not in the current year, include the year. */
export const formatDateMonthAndDay = (date: Date) => {
  if (date.getUTCFullYear() === new Date().getUTCFullYear())
    return dateFormatter.format(date);
  else return dateFormatterWithYear.format(date);
};

/** Parse decimal number according to user's locale. Shamelessly copied from https://stackoverflow.com/a/45309230 */
export const parseLocaleNumber = (
  value: string,
  locales = typeof navigator !== "undefined" ? navigator.languages : undefined
) => {
  const example = Intl.NumberFormat(locales).format(1.1);
  const cleanPattern = new RegExp(`[^0-9${example.charAt(1)}]`, "g");
  const cleaned = value.replace(cleanPattern, "");
  const normalized = cleaned.replace(example.charAt(1), ".");

  return parseFloat(normalized);
};

const emojiRegex =
  // biome-ignore lint/suspicious/noMisleadingCharacterClass: false positive
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
 * Checks for the 'activeTab' and 'scripting' permissions before executing.
 * @returns a Promise with the result of the given function
 * @throws any errors that arise, including browser permission errors.
 */
export const executeScriptInCurrentTab = async <T>(func: () => T) => {
  const granted = await checkPermissions(["activeTab", "scripting"]);
  if (!granted) throw new Error("Permission denied to execute script in current tab.");

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) throw new Error("Couldn't identify open tab.");
  const [{ result }] = await browser.scripting.executeScript({
    func,
    target: { tabId: tab.id },
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
    browser.permissions.request({ permissions }, (granted) => {
      if (granted) resolve(true);
      else {
        console.error("Permission denied:", browser.runtime.lastError);
        resolve(false);
      }
    });
  });

/** Check if optional permissions exist */
export const checkPermissions = (permissions: OptionalPermissions[]) =>
  new Promise<boolean>((resolve) => {
    browser.permissions.contains({ permissions }, (granted) => {
      resolve(granted);
    });
  });

/** Remove optional permissions. */
export const removePermissions = (permissions: OptionalPermissions[]) =>
  new Promise<boolean>((resolve) =>
    browser.permissions.remove({ permissions }, (removed) => {
      if (removed) resolve(true);
      else {
        console.error("Error removing permissions:", browser.runtime.lastError);
        resolve(false);
      }
    })
  );

export const flagColorToEmoji = (flagColor: TransactionFlagColor | {}) => {
  switch (flagColor) {
    case "blue":
      return "🔵";
    case "green":
      return "🟢";
    case "orange":
      return "🟠";
    case "purple":
      return "🟣";
    case "red":
      return "🔴";
    case "yellow":
      return "🟡";
    default:
      return null;
  }
};

/**
 * Wait for an internet connection to be established.
 * @param timeoutMs - The maximum time to wait for a connection, in milliseconds. Default is 10 seconds.
 * @returns A Promise that resolves when an internet connection is established, or rejects if the timeout is reached.
 */
export function waitForInternetConnection(timeoutMs: number = 10 * 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    if (navigator.onLine) {
      setTimeout(resolve, 1000); // wait additional second for connection stability
    } else {
      const intervalId = setInterval(() => {
        if (navigator.onLine) {
          clearInterval(intervalId);
          setTimeout(resolve, 1000);
        } else if (Date.now() - startTime > timeoutMs) {
          clearInterval(intervalId);
          reject(new Error("No internet connection!"));
        }
      }, 1000);
    }
  });
}

export function getCurrentMonthInISOFormat(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export function convertMilliUnitsToCurrencyAmount(
  milliunits: number,
  currencyDecimalDigits: number = 2
): number {
  let numberToRoundTo = Math.pow(10, 3 - Math.min(3, currencyDecimalDigits));
  numberToRoundTo = 1 / numberToRoundTo;
  const rounded = Math.round(milliunits * numberToRoundTo) / numberToRoundTo;
  const currencyAmount = rounded * (0.1 / Math.pow(10, 2));
  return Number(currencyAmount.toFixed(currencyDecimalDigits));
}
