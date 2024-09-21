import { useIsFetching } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  AlertTriangle,
  BoxMultiple,
  Check,
  ExternalLink,
  Pencil,
  PencilOff,
  Refresh,
  Settings
} from "tabler-icons-react";

import { BudgetSelect, IconButton, IconSpan } from "~components";
import { useAuthContext, useStorageContext, useYNABContext } from "~lib/context";
import { isDataFresh } from "~lib/utils";

/** Navigation at the top of the extension popup. Allows user to switch budgets, access settings, etc. */
export default function PopupNav() {
  const { tokenExpired } = useAuthContext();
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

  const openBudget = useCallback(() => {
    window.open(`https://app.ynab.com/${selectedBudgetId}/budget`, "_blank");
  }, [selectedBudgetId]);

  const openPopupWindow = useCallback(() => {
    window.open(
      chrome.runtime.getURL("popup.html"),
      "peekWindow",
      "width=340,height=500"
    );
    window.close();
  }, []);

  if (tokenRefreshNeeded) return <div>Loading...</div>; // refreshing token
  if (!tokenRefreshNeeded && tokenExpired) return <div>Authentication error!</div>; // token refresh issue
  if (!shownBudgetsData && isRefreshingBudgets) return <div>Loading budgets...</div>; // (re-)fetching budgets
  if (!shownBudgetsData || !settings) return null; // storage not hydrated yet

  return (
    <nav className="flex-row justify-between mb-lg">
      <IconSpan
        label={
          categoriesError || accountsError
            ? "Error getting data from YNAB!"
            : globalIsFetching
              ? "Status: Refreshing data..."
              : `Status: Last updated ${new Date(
                  categoriesLastUpdated < accountsLastUpdated
                    ? categoriesLastUpdated
                    : accountsLastUpdated
                ).toLocaleString()}`
        }
        icon={
          categoriesError || accountsError ? (
            <AlertTriangle aria-hidden color="var(--stale)" /> // indicates error while fetching data
          ) : globalIsFetching ? (
            <Refresh aria-hidden />
          ) : !selectedBudgetId ||
            (isDataFresh(categoriesLastUpdated) && isDataFresh(accountsLastUpdated)) ? (
            <Check aria-hidden color="var(--success)" />
          ) : (
            <AlertTriangle aria-hidden color="var(--stale)" /> // indicates data is stale/old
          )
        }
        spin={Boolean(globalIsFetching)}
      />
      <div className="flex-row gap-xs">
        <BudgetSelect
          emojiMode={settings.emojiMode}
          shownBudgets={shownBudgetsData}
          selectedBudgetId={selectedBudgetId}
          setSelectedBudgetId={setSelectedBudgetId}
        />
        <IconButton
          label="Open this budget in YNAB"
          onClick={openBudget}
          icon={<ExternalLink aria-hidden />}
        />
        {window.name !== "peekWindow" && (
          <IconButton
            label="Open this extension in a separate window"
            onClick={openPopupWindow}
            icon={<BoxMultiple aria-hidden />}
          />
        )}
        <IconButton
          label="Settings"
          onClick={() => chrome?.runtime?.openOptionsPage()}
          icon={<Settings aria-hidden />}
        />
        <IconButton
          label={popupState.editMode ? "Done editing" : "Edit pinned items"}
          onClick={() => setPopupState({ view: "main", editMode: !popupState.editMode })}
          icon={popupState.editMode ? <PencilOff aria-hidden /> : <Pencil aria-hidden />}
        />
      </div>
    </nav>
  );
}
