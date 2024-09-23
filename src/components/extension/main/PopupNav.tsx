import { Item } from "@react-stately/collections";
import { useIsFetching } from "@tanstack/react-query";
import { type Key, useCallback } from "react";
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
import { isDataFreshForDisplay } from "~lib/utils";

import PopupNavMenu from "./PopupNavMenu";

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

  const onMenuAction = useCallback(
    (key: Key) => {
      switch (key) {
        case "editItems":
          setPopupState({ view: "main", editMode: !popupState.editMode });
          break;
        case "openWindow":
          openPopupWindow();
          break;
        case "openOptions":
          chrome?.runtime?.openOptionsPage();
          break;
      }
    },
    [openPopupWindow, popupState.editMode, setPopupState]
  );

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
            (isDataFreshForDisplay(categoriesLastUpdated) &&
              isDataFreshForDisplay(accountsLastUpdated)) ? (
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
      </div>
      <div className="flex-row gap-xs">
        {popupState.editMode && (
          <IconButton
            label="Done editing"
            onClick={() => setPopupState({ view: "main" })}
            icon={<PencilOff aria-hidden />}
          />
        )}
        <PopupNavMenu
          label="Menu"
          onAction={onMenuAction}
          disabledKeys={window.name === "peekWindow" ? ["openWindow"] : []}
          animationsEnabled={settings.animations}>
          <Item
            key="editItems"
            textValue={popupState.editMode ? "Done editing" : "Edit pinned items"}>
            <div className="flex-row gap-sm">
              {popupState.editMode ? (
                <PencilOff aria-hidden size={20} />
              ) : (
                <Pencil aria-hidden size={20} />
              )}
              {popupState.editMode ? "Done editing" : "Edit pinned items"}
            </div>
          </Item>
          <Item key="openWindow" textValue="Open in new window">
            <div className="flex-row gap-sm">
              <BoxMultiple aria-hidden size={20} />
              Open in new window
            </div>
          </Item>
          <Item key="openOptions" textValue="Settings">
            <div className="flex-row gap-sm">
              <Settings aria-hidden size={20} />
              Settings
            </div>
          </Item>
        </PopupNavMenu>
      </div>
    </nav>
  );
}
