import { useCallback, useEffect, useMemo, useState } from "react";

import type { Payee } from "./api/client";
import { useSavedPayees } from "./state";
import type { BudgetMainData } from "./types";
import type { TransactionFormDispatch } from "./useTransaction";
import { executeScriptInCurrentTab } from "./utils";

export default function useRememberPayee(
  enabled: boolean,
  budgetId: string,
  budgetMainData: BudgetMainData,
  settingsSynced: boolean,
  dispatch: TransactionFormDispatch,
  currentPayee?: Payee | { name: string } | null
) {
  // Get current budget's saved payees from storage
  const { savePayeeForUrl, forgetPayeeForUrl, getSavedPayeeForUrl } = useSavedPayees(
    budgetId,
    settingsSynced
  );

  // Get current tab's URL host if permission is granted
  const [host, setHost] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    executeScriptInCurrentTab(() => location.host)
      .then((host) => {
        const strippedHost = host.replace(/^www\./, "");
        setHost(strippedHost);
      })
      .catch((err) => {
        console.warn("Failed to get current tab host:", err);
      });
  }, [enabled]);

  /** Whether the current payee can be remembered (must have an ID and website host must be known) */
  const canRememberPayee = enabled && !!host && !!currentPayee && "id" in currentPayee;

  /** Whether the current payee is remembered for the current website host */
  const isRememberedPayee = useMemo(
    () => canRememberPayee && getSavedPayeeForUrl(host) === currentPayee.id,
    [canRememberPayee, host, currentPayee, getSavedPayeeForUrl]
  );

  /** Toggle whether to remember the payee for the current website host */
  const onToggleRememberPayee = useCallback(() => {
    if (isRememberedPayee && host) forgetPayeeForUrl(host);
    else if (canRememberPayee) savePayeeForUrl(currentPayee.id, host);
  }, [
    host,
    canRememberPayee,
    isRememberedPayee,
    currentPayee,
    forgetPayeeForUrl,
    savePayeeForUrl,
  ]);

  // If no payee is selected, auto-select the remembered payee for the current website host if there is one
  useEffect(() => {
    if (currentPayee !== undefined || !host) return;
    const payeeId = getSavedPayeeForUrl(host);
    if (payeeId) {
      const savedPayee = budgetMainData.payeesData.find((p) => p.id === payeeId);
      if (savedPayee) dispatch({ type: "setPayee", payee: savedPayee });
    }
  }, [currentPayee, host, getSavedPayeeForUrl, dispatch, budgetMainData]);

  return { host, isRememberedPayee, canRememberPayee, onToggleRememberPayee };
}
