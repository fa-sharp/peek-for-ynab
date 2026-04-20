import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { CountUp } from "~components";
import type { CurrencyFormat } from "~lib/api/client";
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
  animationEnabled = false,
}: Props) {
  const currencyFormatter = useMemo(
    () => getCurrencyFormatter(currencyFormat),
    [currencyFormat]
  );
  const formatValue = useCallback(
    (millis: number) => currencyFormatter(millis),
    [currencyFormatter]
  );

  const currValueRef = useRef(milliUnits);
  const prevValueRef = useRef(milliUnits);
  useEffect(() => {
    prevValueRef.current = currValueRef.current;
    currValueRef.current = milliUnits;
  }, [milliUnits]);

  const hasValueChanged = prevValueRef.current !== milliUnits;

  const className = useMemo(
    () =>
      clsx("currency", {
        positive: colorsEnabled && milliUnits > 0,
        negative: colorsEnabled && milliUnits < 0,
        hidden: hideBalance,
      }),
    [colorsEnabled, milliUnits, hideBalance]
  );

  return !animationEnabled || !hasValueChanged ? (
    <span className={className}>{formatValue(milliUnits)}</span>
  ) : (
    <CountUp
      className={className}
      start={prevValueRef.current}
      end={milliUnits}
      duration={1.2}
      formattingFn={formatValue}
    />
  );
}
export default CurrencyView;
