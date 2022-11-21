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

  if (!shownBudgetsData) return <p>Loading budgets...</p>;

  return (
    <nav
      style={{
        maxWidth: "280px",
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
      <IconButton label="Switch budget" onClick={switchBudget} icon={<ArrowsDownUp />} />
      <IconButton
        label="Open this budget in YNAB"
        onClick={() =>
          window.open(
            `https://app.youneedabudget.com/${selectedBudgetId}/budget`,
            "_blank"
          )
        }
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
            <Refresh />
          ) : !selectedBudgetId || categoriesLastUpdated + 240_000 > Date.now() ? (
            <Check />
          ) : (
            <AlertTriangle /> // indicates data is stale/old
          )
        }
        spin={Boolean(globalIsFetching || isRefreshingToken)}
        disabled={true}
      />
    </nav>
  );
}
