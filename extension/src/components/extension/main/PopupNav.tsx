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
  SwitchHorizontal,
} from "tabler-icons-react";

import { browser } from "#imports";
import { BudgetSelect, IconButton, Menu } from "~components";
import { useAuthContext, useStorageContext, useYNABContext } from "~lib/context";

/** Whether data is considered fresh for display, based on `lastUpdated` time (<4 minutes old) */
const isDataFreshForDisplay = (lastUpdated: number) => lastUpdated + 240_000 > Date.now();

/** Navigation at the top of the extension popup. Allows user to switch budgets, access settings, etc. */
export default function PopupNav() {
  const { authError } = useAuthContext();
  const { popupState, setPopupState, settings, editingItems, setEditingItems } =
    useStorageContext();
  const {
    budgetsData,
    accountsLastUpdated,
    accountsError,
    categoriesError,
    categoriesLastUpdated,
    refetchCategoriesAndAccounts,
    isRefreshingBudgets,
  } = useYNABContext();

  const globalIsFetching = useIsFetching();

  const shownBudgetsData = useMemo(
    () => budgetsData?.filter((b) => settings.budgets?.includes(b.id)),
    [budgetsData, settings.budgets]
  );

  const openBudget = useCallback(() => {
    window.open(`https://app.ynab.com/${popupState.budgetId}/budget`, "_blank");
  }, [popupState.budgetId]);

  const openPopupWindow = useCallback(() => {
    window.open(
      browser.runtime.getURL("/popup.html"),
      "peekWindow",
      "width=320,height=500"
    );
    window.close();
  }, []);

  const onMenuAction = useCallback(
    (key: Key) => {
      switch (key) {
        case "addTransaction":
          setPopupState({ view: "txAdd", txState: {} });
          break;
        case "addTransfer":
          setPopupState({
            view: "txAdd",
            txState: { isTransfer: true, accountId: "none" },
          });
          break;
        case "moveMoney":
          setPopupState({ view: "move", moveMoneyState: {} });
          break;
        case "editItems":
          setEditingItems(!editingItems);
          break;
        case "openWindow":
          openPopupWindow();
          break;
        case "openOptions":
          browser?.runtime?.openOptionsPage();
          break;
        case "backToMain":
          setPopupState({
            view: "main",
          });
          break;
      }
    },
    [editingItems, openPopupWindow, setEditingItems, setPopupState]
  );

  if (!shownBudgetsData && isRefreshingBudgets) return <div>Loading budgets...</div>; // (re-)fetching budgets
  if (!shownBudgetsData) return null; // No budgets to show

  return (
    <nav className="flex-row justify-between mb-md">
      <IconButton
        label={
          authError
            ? `Authentication error: ${authError}`
            : categoriesError || accountsError
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
          ) : authError || categoriesError || accountsError ? (
            <AlertTriangle aria-hidden color="var(--stale)" /> // indicates error while fetching data
          ) : !popupState.budgetId ||
            (isDataFreshForDisplay(categoriesLastUpdated) &&
              isDataFreshForDisplay(accountsLastUpdated)) ? (
            <Check aria-hidden color="var(--success)" />
          ) : (
            <AlertTriangle aria-hidden color="var(--stale)" /> // indicates data is stale/old
          )
        }
        onClick={() => refetchCategoriesAndAccounts()}
        disabled={
          Boolean(globalIsFetching) ||
          !popupState.budgetId ||
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
            setPopupState({ view: "main", budgetId: id });
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
          icon: <Plus aria-hidden size={20} />,
        },
        {
          key: "addTransfer",
          text: "Add transfer/payment",
          icon: <SwitchHorizontal aria-hidden size={20} />,
        },
        {
          key: "moveMoney",
          text: "Move money",
          icon: <SwitchHorizontal aria-hidden size={20} />,
        },
        {
          key: "editItems",
          text: editingItems ? "Done editing" : "Edit pinned items",
          icon: editingItems ? (
            <PencilOff aria-hidden size={20} />
          ) : (
            <Pencil aria-hidden size={20} />
          ),
        },
      ]
    : [
        {
          key: "backToMain",
          text: "Back to main view",
          icon: <ArrowBack aria-hidden size={20} />,
        },
      ]),
  {
    key: "openWindow",
    text: "Open in new window",
    icon: <BoxMultiple aria-hidden size={20} />,
  },
  { key: "openOptions", text: "Settings", icon: <Settings aria-hidden size={20} /> },
];
