import { useMemo } from "react";

import { storage } from "#imports";
import { DEFAULT_BUDGET_SETTINGS, STORAGE_KEYS } from "~lib/constants";
import type { BudgetSettings } from "~lib/types";
import { safeMigrateJsonString, useChromeStorage } from "./utils";

export function budgetSettingsStorage(budgetId: string, area: "local" | "sync") {
  return storage.defineItem<BudgetSettings>(
    `${area}:${STORAGE_KEYS.BudgetSettings(budgetId)}`,
    {
      fallback: DEFAULT_BUDGET_SETTINGS,
      version: 2,
      migrations: {
        2: safeMigrateJsonString<BudgetSettings>(DEFAULT_BUDGET_SETTINGS),
      },
    }
  );
}

export const useBudgetSettings = (budgetId: string, sync: boolean) => {
  const budgetSettingsStore = useMemo(
    () => budgetSettingsStorage(budgetId, sync ? "sync" : "local"),
    [budgetId, sync]
  );
  const [budgetSettings, setBudgetSettings] = useChromeStorage(budgetSettingsStore);

  return [budgetSettings, setBudgetSettings] as const;
};
