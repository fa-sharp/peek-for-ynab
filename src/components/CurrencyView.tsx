import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountUp from "react-countup";
import { type CurrencyFormat } from "ynab";

import { getCurrencyFormatter } from "~lib/utils";

type Props = {
  milliUnits: number;
  currencyFormat?: CurrencyFormat;
  colorsEnabled?: boolean;
  hideBalance?: boolean;
  animationEnabled?: boolean;
};

function CurrencyView({
  milliUnits,
  currencyFormat,
  colorsEnabled = false,
  hideBalance = false,
  animationEnabled = false
}: Props) {
  const currencyFormatter = useMemo(
    () => getCurrencyFormatter(currencyFormat),
    [currencyFormat]
  );
  const formatValue = useCallback(
    (millis: number) => currencyFormatter(millis),
    [currencyFormatter]
  );

  const [currValue, setCurrValue] = useState(() => milliUnits);
  const prevValueRef = useRef(milliUnits);
  useEffect(() => {
    setCurrValue((prev) => {
      prevValueRef.current = prev;
      return milliUnits;
    });
  }, [milliUnits]);

  const className = useMemo(
    () =>
      clsx("currency", {
        positive: colorsEnabled && currValue > 0,
        negative: colorsEnabled && currValue < 0,
        hidden: hideBalance
      }),
    [colorsEnabled, currValue, hideBalance]
  );

  return !animationEnabled ? (
    <span className={className}>{formatValue(milliUnits)}</span>
  ) : (
    <CountUp
      className={className}
      start={prevValueRef.current}
      end={currValue}
      duration={1.2}
      formattingFn={formatValue}
    />
  );
}
export default CurrencyView;
