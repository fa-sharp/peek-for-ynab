import type { CurrencyFormat } from "ynab";

import { formatCurrency } from "~lib/utils";

type Props = {
  milliUnits: number;
  currencyFormat?: CurrencyFormat;
  colorsEnabled?: boolean;
  hideBalance?: boolean;
};

function CurrencyView({
  milliUnits,
  currencyFormat,
  colorsEnabled = false,
  hideBalance = false
}: Props) {
  let className = !colorsEnabled
    ? "currency"
    : milliUnits > 0
    ? "currency positive"
    : milliUnits < 0
    ? "currency negative"
    : "currency";
  if (hideBalance) className += " hidden";

  return <span className={className}>{formatCurrency(milliUnits, currencyFormat)}</span>;
}

export default CurrencyView;
