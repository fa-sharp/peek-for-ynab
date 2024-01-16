import { clsx } from "clsx";
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
  return (
    <span
      className={clsx("currency", {
        positive: colorsEnabled && milliUnits > 0,
        negative: colorsEnabled && milliUnits < 0,
        hidden: hideBalance
      })}>
      {formatCurrency(milliUnits, currencyFormat)}
    </span>
  );
}

export default CurrencyView;
