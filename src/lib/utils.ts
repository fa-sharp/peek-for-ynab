import { useLayoutEffect } from "react";
import useLocalStorageState from "use-local-storage-state";
import * as ynab from "ynab";

export const IS_DEV = process.env.NODE_ENV === "development";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const ONE_DAY_IN_MILLIS = 1000 * 60 * 60 * 24;
export const TWO_WEEKS_IN_MILLIS = ONE_DAY_IN_MILLIS * 7 * 2;

export const getCurrencyFormatter = (
  /** the budget's `currency_format` property from YNAB */
  currencyFormat = { iso_code: "USD", decimal_digits: 2 }
) => {
  const formatter = new Intl.NumberFormat("default", {
    style: "currency",
    currency: currencyFormat.iso_code,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: currencyFormat.decimal_digits
  });
  return (millis: number) => {
    const currencyAmount = ynab.utils.convertMilliUnitsToCurrencyAmount(
      millis,
      currencyFormat.decimal_digits
    );
    return formatter.format(currencyAmount);
  };
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

export const findCCAccount = (accountsData: ynab.Account[], name: string) =>
  accountsData?.find(
    (a) => (a.type === "creditCard" || a.type === "lineOfCredit") && a.name === name
  );

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

/** Request permissions to access the current tab and execute scripts within it */
export const requestCurrentTabPermissions = () =>
  new Promise<boolean>((resolve) => {
    chrome.permissions.request(
      {
        permissions: ["activeTab", "scripting"]
      },
      (granted) => {
        if (granted) resolve(true);
        else {
          console.error("Permission denied:", chrome.runtime.lastError);
          resolve(false);
        }
      }
    );
  });

/** Remove permissions to access the current tab */
export const removeCurrentTabPermissions = () =>
  new Promise<boolean>((resolve) =>
    chrome.permissions.remove(
      {
        permissions: ["activeTab", "scripting"]
      },
      (removed) => {
        if (removed) resolve(true);
        else {
          console.error("Error removing permissions:", chrome.runtime.lastError);
          resolve(false);
        }
      }
    )
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

/**
 * Sets the theme based on user setting in localStorage and media query.
 * See also [theme.js](../../public/scripts/theme.js) which avoids the 'flash' on load.
 */
export const useSetColorTheme = () => {
  const [themeSetting] = useLocalStorageState<"light" | "dark" | "auto">("theme", {
    defaultValue: "auto"
  });

  useLayoutEffect(() => {
    const prefersDarkModeQuery = window?.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

    if (
      (themeSetting === "auto" && prefersDarkModeQuery?.matches) ||
      themeSetting === "dark"
    )
      document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const listener = (e: MediaQueryListEvent) => {
      if ((themeSetting === "auto" && e.matches) || themeSetting === "dark")
        document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    };
    prefersDarkModeQuery?.addEventListener("change", listener);

    return () => prefersDarkModeQuery?.removeEventListener("change", listener);
  }, [themeSetting]);
};
