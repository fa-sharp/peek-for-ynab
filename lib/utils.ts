import * as ynab from "ynab";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const formatCurrency = (millis: number) => {
  const currencyAmount = ynab.utils.convertMilliUnitsToCurrencyAmount(millis);
  // Ensure two decimal places, or none if integer
  const formattedString =
    "$" + (Number.isInteger(currencyAmount) ? currencyAmount : currencyAmount.toFixed(2));
  return formattedString;
};
