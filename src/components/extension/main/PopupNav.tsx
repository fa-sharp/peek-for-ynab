import { Item } from "@react-stately/collections";
import { useIsFetching } from "@tanstack/react-query";
import { type Key, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  BoxMultiple,
  Check,
  ExternalLink,
  Menu2,
  Pencil,
  PencilOff,
  Plus,
  Refresh,
  Settings,
  SwitchHorizontal
} from "tabler-icons-react";

import { BudgetSelect, IconButton } from "~components";
import { useAuthContext, useStorageContext, useYNABContext } from "~lib/context";

import PopupNavMenu from "./PopupNavMenu";

/** Whether data is considered fresh for display, based on `lastUpdated` time (<4 minutes old) */
const isDataFreshForDisplay = (lastUpdated: number) => lastUpdated + 240_000 > Date.now();

/** Navigation at the top of the extension popup. Allows user to switch budgets, access settings, etc. */
export default function PopupNav() {
  const { tokenExpired } = useAuthContext();
  const {
    selectedBudgetId,
    settings,
    tokenRefreshNeeded,
    popupState,
    shownBudgetIds,
    setPopupState,
    setSelectedBudgetId
  } = useStorageContext();
  const {
    budgetsData,
    accountsLastUpdated,
    accountsError,
    categoriesError,
    categoriesLastUpdated,
    refreshCategoriesAndAccounts,
    isRefreshingBudgets
  } = useYNABContext();
  const globalIsFetching = useIsFetching();

  const shownBudgetsData = useMemo(
    () => budgetsData?.filter((b) => shownBudgetIds?.includes(b.id)),
    [budgetsData, shownBudgetIds]
  );

  const openBudget = useCallback(() => {
    window.open(`https://app.ynab.com/${selectedBudgetId}/budget`, "_blank");
  }, [selectedBudgetId]);

  const openPopupWindow = useCallback(() => {
    window.open(
      chrome.runtime.getURL("popup.html"),
      "peekWindow",
      "width=320,height=500"
    );
    window.close();
  }, []);

  const onMenuAction = useCallback(
    (key: Key) => {
      switch (key) {
        case "addTransaction":
          setPopupState({ view: "txAdd" });
          break;
        case "addTransfer":
          setPopupState({
            view: "txAdd",
            txAddState: { isTransfer: true, accountId: "none" }
          });
          break;
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
      <IconButton
        label={
          categoriesError || accountsError
            ? "Error getting data from YNAB! Click to retry"
            : globalIsFetching
              ? "Status: Refreshing data..."
              : `Status: Last updated ${new Date(
                  categoriesLastUpdated < accountsLastUpdated
                    ? categoriesLastUpdated
                    : accountsLastUpdated
                ).toLocaleString()}`
        }
        icon={
          globalIsFetching ? (
            <Refresh aria-hidden />
          ) : categoriesError || accountsError ? (
            <AlertTriangle aria-hidden color="var(--stale)" /> // indicates error while fetching data
          ) : !selectedBudgetId ||
            (isDataFreshForDisplay(categoriesLastUpdated) &&
              isDataFreshForDisplay(accountsLastUpdated)) ? (
            <Check aria-hidden color="var(--success)" />
          ) : (
            <AlertTriangle aria-hidden color="var(--stale)" /> // indicates data is stale/old
          )
        }
        onClick={() => refreshCategoriesAndAccounts()}
        disabled={
          Boolean(globalIsFetching) ||
          !selectedBudgetId ||
          (!categoriesError &&
            !accountsError &&
            isDataFreshForDisplay(categoriesLastUpdated) &&
            isDataFreshForDisplay(accountsLastUpdated))
        }
        spin={Boolean(globalIsFetching)}
      />
      <div className="flex-row gap-xs">
        <BudgetSelect
          emojiMode={settings.emojiMode}
          animationsEnabled={settings.animations}
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
          icon={<Menu2 aria-hidden />}
          onAction={onMenuAction}
          disabledKeys={window.name === "peekWindow" ? ["openWindow"] : []}
          animationsEnabled={settings.animations}>
          <Item key="addTransaction" textValue="Add transaction">
            <div className="flex-row gap-sm">
              <Plus aria-hidden size={20} />
              Add transaction
            </div>
          </Item>
          <Item key="addTransfer" textValue="Add transfer/payment">
            <div className="flex-row gap-sm">
              <SwitchHorizontal aria-hidden size={20} />
              Add transfer/payment
            </div>
          </Item>
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
