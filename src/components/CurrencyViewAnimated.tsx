import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CountUp from "react-countup";
import { type CurrencyFormat, utils as ynabUtils } from "ynab";

type Props = {
  milliUnits: number;
  currencyFormat?: CurrencyFormat;
  colorsEnabled?: boolean;
  hideBalance?: boolean;
  animationEnabled?: boolean;
};

function CurrencyViewAnimated({
  milliUnits,
  currencyFormat,
  colorsEnabled,
  hideBalance,
  animationEnabled
}: Props) {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("default", {
        style: "currency",
        currency: currencyFormat?.iso_code || "USD",
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: currencyFormat?.decimal_digits ?? 2
      }),
    [currencyFormat?.decimal_digits, currencyFormat?.iso_code]
  );
  const formatValue = useCallback(
    (millis: number) =>
      formatter.format(
        ynabUtils.convertMilliUnitsToCurrencyAmount(
          millis,
          currencyFormat?.decimal_digits
        )
      ),
    [currencyFormat?.decimal_digits, formatter]
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

  return (
    <CountUp
      className={className}
      start={animationEnabled ? prevValueRef.current : currValue}
      end={currValue}
      duration={1.2}
      formattingFn={formatValue}
    />
  );
}
export default CurrencyViewAnimated;
