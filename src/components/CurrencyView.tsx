import type { CurrencyFormat } from "ynab";

import { formatCurrency } from "~lib/utils";

type Props = {
  milliUnits: number;
  currencyFormat?: CurrencyFormat;
  colorsEnabled?: boolean;
};

function CurrencyView({ milliUnits, currencyFormat, colorsEnabled = false }: Props) {
  const className = !colorsEnabled
    ? "currency"
    : milliUnits >= 0
    ? "currency positive"
    : "currency negative";
  return <span className={className}>{formatCurrency(milliUnits, currencyFormat)}</span>;
}

export default CurrencyView;
