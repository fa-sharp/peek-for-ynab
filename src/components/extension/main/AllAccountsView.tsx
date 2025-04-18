import { useId, useState } from "react";
import type { Account } from "ynab";

import { AccountView, IconButton, IconSpan, Toolbar } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import type { AccountAlerts } from "~lib/notifications";
import type {
  AppSettings,
  CachedBudget,
  DetailViewState,
  TxAddInitialState
} from "~lib/types";

import {
  AddTransactionIcon,
  CollapseListIcon,
  CollapseListIconBold,
  DetailIcon,
  ExpandListIcon,
  ExpandListIconBold,
  PinItemIcon,
  PinnedItemIcon
} from "../../icons/ActionIcons";

/** View of all accounts in a budget, grouped by Budget / Tracking */
export default function AllAccountsView() {
  const {
    savedAccounts,
    saveAccount,
    setPopupState,
    setTxState,
    popupState,
    editingItems,
    settings
  } = useStorageContext();
  const { accountsData, selectedBudgetData } = useYNABContext();
  const { currentAlerts } = useNotificationsContext();

  const [expanded, setExpanded] = useState(false);
  const controlsId = useId();

  if (!popupState || !selectedBudgetData || !accountsData || !savedAccounts || !settings)
    return null;

  return (
    <>
      <div
        className={"heading-medium cursor-pointer"}
        onClick={() => setExpanded(!expanded)}>
        <IconButton
          aria-controls={controlsId}
          aria-expanded={expanded}
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? <CollapseListIconBold /> : <ExpandListIconBold />}
        />
        <div role="heading">Accounts</div>
      </div>
      {expanded && (
        <ul id={controlsId} className="list">
          <li>
            <AccountTypeView
              accountType="Budget"
              accountsData={accountsData.filter((a) => a.on_budget)}
              accountAlerts={currentAlerts?.[selectedBudgetData.id]?.accounts}
              savedAccounts={savedAccounts[selectedBudgetData.id]}
              saveAccount={saveAccount}
              editMode={editingItems}
              budgetData={selectedBudgetData}
              settings={settings}
              onAddTx={async (txAddState) => {
                await setTxState(txAddState);
                setPopupState({ view: "txAdd" });
              }}
              onOpenDetailView={(detailState) =>
                setPopupState({ view: "detail", detailState })
              }
            />
          </li>
          <li>
            <AccountTypeView
              accountType="Tracking"
              accountsData={accountsData.filter((a) => !a.on_budget)}
              accountAlerts={currentAlerts?.[selectedBudgetData.id]?.accounts}
              savedAccounts={savedAccounts[selectedBudgetData.id]}
              saveAccount={saveAccount}
              editMode={editingItems}
              budgetData={selectedBudgetData}
              settings={settings}
              onAddTx={async (txAddState) => {
                await setTxState(txAddState);
                setPopupState({ view: "txAdd" });
              }}
              onOpenDetailView={(detailState) =>
                setPopupState({ view: "detail", detailState })
              }
            />
          </li>
        </ul>
      )}
    </>
  );
}

/** View of an account type - can expand to show all accounts and balances */
function AccountTypeView({
  accountType,
  accountsData,
  budgetData,
  accountAlerts,
  saveAccount,
  savedAccounts,
  settings,
  editMode,
  onAddTx,
  onOpenDetailView
}: {
  accountType: "Budget" | "Tracking";
  accountsData: Account[];
  budgetData: CachedBudget;
  accountAlerts?: AccountAlerts;
  savedAccounts?: string[];
  saveAccount: (accountId: string) => void;
  settings: AppSettings;
  editMode?: boolean;
  onAddTx: (initialState: TxAddInitialState) => void;
  onOpenDetailView: (detailState: DetailViewState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const controlsId = useId();

  return (
    <>
      <div
        className="heading-small heading-bordered cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <IconButton
          aria-controls={controlsId}
          aria-expanded={expanded}
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? <CollapseListIcon /> : <ExpandListIcon />}
        />
        <div role="heading">{accountType}</div>
      </div>
      {expanded && (
        <ul id={controlsId} className="list">
          {accountsData.map((account) => (
            <li key={account.id}>
              <AccountView
                account={account}
                currencyFormat={budgetData.currencyFormat}
                settings={settings}
                alerts={accountAlerts?.[account.id]}
                actionElementsLeft={
                  !editMode ? null : savedAccounts?.some((id) => id === account.id) ? (
                    <IconSpan icon={<PinnedItemIcon />} label="Pinned" />
                  ) : (
                    <IconButton
                      icon={<PinItemIcon />}
                      label="Pin"
                      onClick={() => saveAccount(account.id)}
                    />
                  )
                }
                actionElementsRight={
                  <Toolbar className="list flex-row gap-sm" aria-label="actions">
                    <IconButton
                      rounded
                      accent
                      icon={<AddTransactionIcon />}
                      label="Add transaction"
                      onClick={() => onAddTx({ accountId: account.id })}
                    />
                    <IconButton
                      accent
                      rounded
                      icon={<DetailIcon />}
                      label="Details/Activity"
                      onClick={() =>
                        onOpenDetailView({ type: "account", id: account.id })
                      }
                    />
                  </Toolbar>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
