import * as ynab from "ynab";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const ONE_DAY_IN_MILLIS = 1000 * 60 * 60 * 24;
export const TWO_WEEKS_IN_MILLIS = ONE_DAY_IN_MILLIS * 7 * 2;

export const formatCurrency = (
  millis: number,
  /** the budget's `currency_format` property from YNAB */
  currencyFormat = { iso_code: "USD", decimal_digits: 2 }
) => {
  const currencyAmount = ynab.utils.convertMilliUnitsToCurrencyAmount(
    millis,
    currencyFormat.decimal_digits
  );
  const formattedString = new Intl.NumberFormat("default", {
    style: "currency",
    currency: currencyFormat.iso_code,
    minimumFractionDigits: currencyFormat.decimal_digits
  }).format(currencyAmount);

  return formattedString;
};

/**
 * Get today's date (user's local timezone) in ISO format (i.e. for `input[type=date]` element)
 */
export const getTodaysDateISO = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().substring(0, 10);
};

/** Parse decimal number according to user's locale. Shamelessly copied from https://stackoverflow.com/a/45309230 */
export const parseLocaleNumber = (value: string, locales = navigator.languages) => {
  //@ts-expect-error shut up TS!
  const example = Intl.NumberFormat(locales).format(1.1);
  const cleanPattern = new RegExp(`[^-+0-9${example.charAt(1)}]`, "g");
  const cleaned = value.replace(cleanPattern, "");
  const normalized = cleaned.replace(example.charAt(1), ".");

  return parseFloat(normalized);
};

const emojiRegex =
  // eslint-disable-next-line no-misleading-character-class
  /[\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{200d}\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}]+/u;

/** Returns the first emoji, or consecutive sequence of emojis, found in a string */
export const findFirstEmoji = (s: string) => {
  const regexResult = emojiRegex.exec(s);
  return regexResult ? regexResult[0] : null;
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

/** Extract any currency amounts on the page. Returns a sorted array of detected amounts, from highest to lowest */
export const extractCurrencyAmounts = () => {
  /** Get all text content from an element and its descendants, including shadow DOMs */
  const getTextContent = (element: Element | ShadowRoot) => {
    let content = element.textContent || "";

    element.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) {
        content += getTextContent(el.shadowRoot);
      }
    });
    return content;
  };

  /** Parse decimal number according to user's locale */
  const parseLocaleNumber = (value: string, locales = navigator.languages) => {
    //@ts-expect-error shut up TS!
    const example = Intl.NumberFormat(locales).format(1.1);
    const cleanPattern = new RegExp(`[^-+0-9${example.charAt(1)}]`, "g");
    const cleaned = value.replace(cleanPattern, "");
    const normalized = cleaned.replace(example.charAt(1), ".");

    return parseFloat(normalized);
  };

  const text = getTextContent(document.body);
  const regex = /[$£€¥]\s?([\d,]+(?:\.\d{1,2})?)/g; // TODO improve this regex for more currencies/locales (or find a different way)
  let match;
  const detected = new Set<number>(); // use a Set to eliminate duplicates
  while ((match = regex.exec(text)) !== null) {
    const amount = parseLocaleNumber(match[1]);
    if (!isNaN(amount)) {
      detected.add(amount);
    }
  }

  // Sort amounts from highest to lowest
  const amounts = Array.from(detected);
  amounts.sort((a, b) => b - a);

  return amounts;
};
