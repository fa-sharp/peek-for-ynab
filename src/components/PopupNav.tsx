import { useIsFetching } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  AlertTriangle,
  ArrowsDownUp,
  Check,
  ExternalLink,
  Pencil,
  PencilOff,
  Refresh,
  Settings
} from "tabler-icons-react";

import { BudgetSelect, IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";

/** Navigation at the top of the extension popup. Allows user to switch budgets, access settings, etc. */
export default function PopupNav() {
  const {
    selectedBudgetId,
    settings,
    tokenRefreshNeeded,
    popupState,
    setPopupState,
    setSelectedBudgetId
  } = useStorageContext();
  const {
    shownBudgetsData,
    accountsLastUpdated,
    accountsError,
    categoriesError,
    categoriesLastUpdated,
    isRefreshingBudgets
  } = useYNABContext();
  const globalIsFetching = useIsFetching();
  const isLoadingData = globalIsFetching || tokenRefreshNeeded;

  const switchBudget = useCallback(() => {
    if (!shownBudgetsData) return;
    const currIndex = shownBudgetsData.findIndex((b) => b.id === selectedBudgetId);
    setSelectedBudgetId(shownBudgetsData[(currIndex + 1) % shownBudgetsData.length].id);
  }, [selectedBudgetId, setSelectedBudgetId, shownBudgetsData]);

  const openBudget = useCallback(() => {
    window.open(`https://app.ynab.com/${selectedBudgetId}/budget`, "_blank");
  }, [selectedBudgetId]);

  if (!shownBudgetsData && isRefreshingBudgets) return <p>Loading budgets...</p>;
  if (!shownBudgetsData || !settings) return null;

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: "0.6rem"
      }}>
      <IconButton
        label={
          categoriesError || accountsError
            ? "Error getting data from YNAB!"
            : isLoadingData
              ? "Status: Refreshing data..."
              : `Status: Last updated ${new Date(
                  categoriesLastUpdated < accountsLastUpdated
                    ? categoriesLastUpdated
                    : accountsLastUpdated
                ).toLocaleString()}`
        }
        icon={
          categoriesError || accountsError ? (
            <AlertTriangle color="var(--stale)" /> // indicates error while fetching data
          ) : isLoadingData ? (
            <Refresh />
          ) : !selectedBudgetId ||
            (categoriesLastUpdated + 240_000 > Date.now() &&
              accountsLastUpdated + 240_000 > Date.now()) ? (
            <Check color="var(--success)" />
          ) : (
            <AlertTriangle color="var(--stale)" /> // indicates data is stale/old
          )
        }
        spin={Boolean(isLoadingData)}
        disabled
        noAction
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 3
        }}>
        <BudgetSelect
          emojiMode={settings.emojiMode}
          shownBudgets={shownBudgetsData}
          selectedBudgetId={selectedBudgetId}
          setSelectedBudgetId={setSelectedBudgetId}
        />
        {shownBudgetsData?.length > 1 && (
          <IconButton
            label="Next budget"
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
          label={popupState.editMode ? "Done editing" : "Edit pinned items"}
          onClick={() => setPopupState({ view: "main", editMode: !popupState.editMode })}
          icon={popupState.editMode ? <PencilOff /> : <Pencil />}
        />
      </div>
    </nav>
  );
}
