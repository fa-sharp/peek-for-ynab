import { useCallback, useMemo } from "react";

import { storage } from "#imports";
import { STORAGE_KEYS } from "~lib/constants";
import type { SavedPayees } from "~lib/types";
import { useChromeStorage } from "./utils";

function savedPayeesStorage(budgetId: string, area: "local" | "sync") {
  return storage.defineItem<SavedPayees>(
    `${area}:${STORAGE_KEYS.SavedPayees(budgetId)}`,
    {
      fallback: {},
    }
  );
}

/** Managed saved payees in storage */
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
        [url]: payeeId,
      }));
    },
    [setSavedPayees]
  );

  const getSavedPayeeForUrl = useCallback(
    (url: string) => {
      return savedPayees?.[url];
    },
    [savedPayees]
  );

  const forgetPayeeForUrl = useCallback(
    (url: string) => {
      setSavedPayees((payees) => ({
        ...payees,
        [url]: undefined,
      }));
    },
    [setSavedPayees]
  );

  return {
    savedPayees,
    getSavedPayeeForUrl,
    savePayeeForUrl,
    forgetPayeeForUrl,
  };
};
