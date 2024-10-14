import { Item } from "@react-stately/collections";
import { useIsFetching } from "@tanstack/react-query";
import { type Key, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  ArrowBack,
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

import { BudgetSelect, IconButton, Menu } from "~components";
import { useAuthContext, useStorageContext, useYNABContext } from "~lib/context";

/** Whether data is considered fresh for display, based on `lastUpdated` time (<4 minutes old) */
const isDataFreshForDisplay = (lastUpdated: number) => lastUpdated + 240_000 > Date.now();

/** Navigation at the top of the extension popup. Allows user to switch budgets, access settings, etc. */
export default function PopupNav() {
  const { tokenExpired } = useAuthContext();
  const {
    settings,
    tokenRefreshNeeded,
    shownBudgetIds,
    editingItems,
    setEditingItems,
    popupState,
    setPopupState,
    setTxState
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
    window.open(`https://app.ynab.com/${popupState?.budgetId}/budget`, "_blank");
  }, [popupState?.budgetId]);

  const openPopupWindow = useCallback(() => {
    window.open(
      chrome.runtime.getURL("popup.html"),
      "peekWindow",
      "width=320,height=500"
    );
    window.close();
  }, []);

  const onMenuAction = useCallback(
    async (key: Key) => {
      switch (key) {
        case "addTransaction":
          setPopupState({ view: "txAdd" });
          break;
        case "addTransfer":
          await setTxState({ isTransfer: true, accountId: "none" });
          setPopupState({ view: "txAdd" });
          break;
        case "editItems":
          setEditingItems(!editingItems);
          break;
        case "openWindow":
          openPopupWindow();
          break;
        case "openOptions":
          chrome?.runtime?.openOptionsPage();
          break;
        case "backToMain":
          await setTxState({});
          setPopupState({ view: "main" });
          break;
      }
    },
    [editingItems, openPopupWindow, setEditingItems, setPopupState, setTxState]
  );

  if (tokenRefreshNeeded) return <div>Loading...</div>; // refreshing token
  if (!tokenRefreshNeeded && tokenExpired) return <div>Authentication error!</div>; // token refresh issue
  if (!shownBudgetsData && isRefreshingBudgets) return <div>Loading budgets...</div>; // (re-)fetching budgets
  if (!shownBudgetsData || !settings || !popupState) return null; // storage not hydrated yet

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
          ) : !popupState?.budgetId ||
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
          !popupState?.budgetId ||
          (!categoriesError &&
            !accountsError &&
            isDataFreshForDisplay(categoriesLastUpdated) &&
            isDataFreshForDisplay(accountsLastUpdated))
        }
        spin={Boolean(globalIsFetching)}
      />
      <div className="flex-row gap-xs">
        <BudgetSelect
          shownBudgets={shownBudgetsData}
          selectedBudgetId={popupState.budgetId}
          setSelectedBudgetId={(id) => {
            setTxState({}).then(() => setPopupState({ budgetId: id }));
          }}
        />
        <IconButton
          label="Open this budget in YNAB"
          onClick={openBudget}
          icon={<ExternalLink aria-hidden />}
        />
        {editingItems && (
          <IconButton
            label="Done editing"
            onClick={() => setEditingItems(false)}
            icon={<PencilOff aria-hidden />}
          />
        )}
        <Menu
          label="Menu"
          icon={<Menu2 aria-hidden />}
          onAction={onMenuAction}
          items={createMenuItems(editingItems, popupState.view === "main")}
          disabledKeys={window.name === "peekWindow" ? ["openWindow"] : []}>
          {(item) => (
            <Item key={item.key} textValue={item.text}>
              <div className="flex-row gap-sm">
                {item.icon} {item.text}
              </div>
            </Item>
          )}
        </Menu>
      </div>
    </nav>
  );
}

const createMenuItems = (editingItems: boolean, onMainPage: boolean) => [
  ...(onMainPage
    ? [
        {
          key: "addTransaction",
          text: "Add transaction",
          icon: <Plus aria-hidden size={20} />
        },
        {
          key: "addTransfer",
          text: "Add transfer/payment",
          icon: <SwitchHorizontal aria-hidden size={20} />
        },
        {
          key: "editItems",
          text: editingItems ? "Done editing" : "Edit pinned items",
          icon: editingItems ? (
            <PencilOff aria-hidden size={20} />
          ) : (
            <Pencil aria-hidden size={20} />
          )
        }
      ]
    : [
        {
          key: "backToMain",
          text: "Back to main view",
          icon: <ArrowBack aria-hidden size={20} />
        }
      ]),
  {
    key: "openWindow",
    text: "Open in new window",
    icon: <BoxMultiple aria-hidden size={20} />
  },
  { key: "openOptions", text: "Settings", icon: <Settings aria-hidden size={20} /> }
];
