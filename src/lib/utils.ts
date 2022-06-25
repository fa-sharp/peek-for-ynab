import * as ynab from "ynab";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const formatCurrency = (
  millis: number,
  /** the budget's `currency_format` property from YNAB */
  currencyFormat = { iso_code: "USD", decimal_digits: 2 }
) => {
  const currencyAmount = ynab.utils.convertMilliUnitsToCurrencyAmount(millis);
  const formattedString = new Intl.NumberFormat("default", {
    style: "currency",
    currency: currencyFormat.iso_code,
    minimumFractionDigits: Number.isInteger(currencyAmount)
      ? 0
      : currencyFormat.decimal_digits
  }).format(currencyAmount);

  return formattedString;
};

/** Returns the first emoji found in a string */
export const findFirstEmoji = (s: string) => {
  const emojiRegex = /[\p{Emoji_Presentation}|\p{Extended_Pictographic}\u200d]+/gu;
  const emojisArray = s.match(emojiRegex);
  return emojisArray ? emojisArray[0] : null;
};
