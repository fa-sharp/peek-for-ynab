import { useState } from "react";
import type { Account } from "ynab";

import { AccountView, IconButton, IconSpan } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import type { AccountAlerts } from "~lib/notifications";
import type { AppSettings, CachedBudget, TxAddInitialState } from "~lib/types";

import {
  AddTransactionIcon,
  CollapseListIcon,
  CollapseListIconBold,
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
    popupState,
    editingItems,
    settings
  } = useStorageContext();
  const { accountsData, selectedBudgetData } = useYNABContext();
  const { currentAlerts } = useNotificationsContext();

  const [expanded, setExpanded] = useState(false);

  if (!popupState || !selectedBudgetData || !accountsData || !savedAccounts || !settings)
    return null;

  return (
    <>
      <div
        className={"heading-big cursor-pointer"}
        onClick={() => setExpanded(!expanded)}>
        <IconButton
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? <CollapseListIconBold /> : <ExpandListIconBold />}
        />
        <div role="heading">Accounts</div>
      </div>
      {expanded && (
        <>
          <AccountTypeView
            accountType="Budget"
            accountsData={accountsData.filter((a) => a.on_budget)}
            accountAlerts={currentAlerts?.[selectedBudgetData.id]?.accounts}
            savedAccounts={savedAccounts[selectedBudgetData.id]}
            saveAccount={saveAccount}
            editMode={editingItems}
            budgetData={selectedBudgetData}
            settings={settings}
            onAddTx={(txAddState) => setPopupState({ view: "txAdd", txAddState })}
          />
          <AccountTypeView
            accountType="Tracking"
            accountsData={accountsData.filter((a) => !a.on_budget)}
            accountAlerts={currentAlerts?.[selectedBudgetData.id]?.accounts}
            savedAccounts={savedAccounts[selectedBudgetData.id]}
            saveAccount={saveAccount}
            editMode={editingItems}
            budgetData={selectedBudgetData}
            settings={settings}
            onAddTx={(txAddState) => setPopupState({ view: "txAdd", txAddState })}
          />
        </>
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
  onAddTx
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
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className="heading-medium heading-bordered cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <IconButton
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? <CollapseListIcon /> : <ExpandListIcon />}
        />
        <div role="heading">{accountType}</div>
      </div>
      {expanded && (
        <ul className="list">
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
                  <aside className="balance-actions" aria-label="actions">
                    <IconButton
                      rounded
                      accent
                      icon={<AddTransactionIcon />}
                      label="Add transaction"
                      onClick={() => onAddTx({ accountId: account.id })}
                    />
                  </aside>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
