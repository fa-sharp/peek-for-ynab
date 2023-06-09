import { useIsFetching } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  AlertTriangle,
  ArrowsDownUp,
  Check,
  ExternalLink,
  Refresh,
  Settings
} from "tabler-icons-react";

import { BudgetSelect, IconButton } from "~components";
import { useAuthContext, useStorageContext, useYNABContext } from "~lib/context";

/** Navigation at the top of the extension popup. Allows user to switch budgets, access settings, etc. */
export default function PopupNav() {
  const { selectedBudgetId, setSelectedBudgetId } = useStorageContext();
  const { shownBudgetsData, categoriesLastUpdated } = useYNABContext();
  const { isRefreshingToken } = useAuthContext();
  const globalIsFetching = useIsFetching();

  const switchBudget = useCallback(() => {
    if (!shownBudgetsData) return;
    const currIndex = shownBudgetsData.findIndex((b) => b.id === selectedBudgetId);
    if (currIndex >= shownBudgetsData.length - 1)
      setSelectedBudgetId(shownBudgetsData[0].id);
    else setSelectedBudgetId(shownBudgetsData[currIndex + 1].id);
  }, [selectedBudgetId, setSelectedBudgetId, shownBudgetsData]);

  const openBudget = useCallback(() => {
    window.open(`https://app.ynab.com/${selectedBudgetId}/budget`, "_blank");
  }, [selectedBudgetId]);

  if (!shownBudgetsData) return null;

  return (
    <nav
      style={{
        marginBottom: 8,
        display: "flex",
        justifyContent: "space-between",
        gap: 3
      }}>
      <BudgetSelect
        shownBudgets={shownBudgetsData}
        selectedBudgetId={selectedBudgetId}
        setSelectedBudgetId={setSelectedBudgetId}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 3
        }}>
        {shownBudgetsData?.length > 1 && (
          <IconButton
            label="Switch budget"
            onClick={switchBudget}
            icon={<ArrowsDownUp />}
          />
        )}
        <IconButton
          label="Open this budget in YNAB"
          onClick={openBudget}
          icon={<ExternalLink />}
        />
        <IconButton
          label="Settings"
          onClick={() => chrome?.runtime?.openOptionsPage()}
          icon={<Settings />}
        />
        <IconButton
          label={`Last Updated: ${new Date(categoriesLastUpdated).toLocaleString()}`}
          onClick={() => undefined}
          icon={
            globalIsFetching || isRefreshingToken ? (
              <Refresh color="black" />
            ) : !selectedBudgetId || categoriesLastUpdated + 240_000 > Date.now() ? (
              <Check color="var(--success)" />
            ) : (
              <AlertTriangle color="var(--stale)" /> // indicates data is stale/old
            )
          }
          spin={Boolean(globalIsFetching || isRefreshingToken)}
          disabled={true}
          noAction={true}
        />
      </div>
    </nav>
  );
}
