import { useCallback, useMemo } from "react";

import { storage } from "#imports";
import { STORAGE_KEYS } from "~lib/constants";
import { useChromeStorage } from "./utils";

/** Map of URLs to payee IDs */
interface SavedPayees {
  [url: string]: string[];
}

function savedPayeesStorage(budgetId: string, area: "local" | "sync") {
  return storage.defineItem<SavedPayees>(
    `${area}:${STORAGE_KEYS.SavedPayees(budgetId)}`,
    {
      fallback: {},
    }
  );
}

export const useSavedPayees = (budgetId: string, sync: boolean) => {
  const savedPayeesStore = useMemo(
    () => savedPayeesStorage(budgetId, sync ? "sync" : "local"),
    [sync, budgetId]
  );
  const [savedPayees, setSavedPayees] = useChromeStorage(savedPayeesStore);

  const savePayeeForUrl = useCallback(
    (payeeId: string, url: string) => {
      setSavedPayees((payees) => ({
        ...payees,
        [url]: [...(payees?.[url] ?? []), payeeId],
      }));
    },
    [setSavedPayees]
  );

  const forgetPayeeForUrl = useCallback(
    (payeeId: string, url: string) => {
      setSavedPayees((payees) => ({
        ...payees,
        [url]: (payees?.[url] ?? []).filter((id) => id !== payeeId),
      }));
    },
    [setSavedPayees]
  );

  return {
    savedPayees,
    savePayeeForUrl,
    forgetPayeeForUrl,
  };
};
