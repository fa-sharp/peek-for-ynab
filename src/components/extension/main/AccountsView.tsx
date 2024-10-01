import { clsx } from "clsx";
import type { ReactElement } from "react";
import { useState } from "react";
import { AlertTriangle, Circle, LockOpen } from "tabler-icons-react";
import type { Account, CurrencyFormat, TransactionDetail } from "ynab";

import { CurrencyView, IconButton, IconSpan } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import type { AccountAlerts } from "~lib/notifications";
import type { AppSettings, CachedBudget, TxAddInitialState } from "~lib/types";
import { formatDateMonthAndDay } from "~lib/utils";

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
function AccountsView() {
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

export const AccountView = ({
  account: { id, name, balance, last_reconciled_at },
  currencyFormat,
  actionElementsLeft,
  actionElementsRight,
  alerts,
  settings,
  addedTransaction
}: {
  account: Account;
  currencyFormat?: CurrencyFormat;
  actionElementsLeft?: ReactElement | null;
  actionElementsRight?: ReactElement | null;
  alerts?: AccountAlerts[string];
  settings: AppSettings;
  addedTransaction?: TransactionDetail | null;
}) => {
  return (
    <div
      className={clsx("balance-display", {
        highlighted:
          settings.animations &&
          (addedTransaction?.account_id === id ||
            addedTransaction?.transfer_account_id === id)
      })}>
      <div className="flex-row gap-sm min-w-0">
        {actionElementsLeft}
        <div className="hide-overflow">{name}</div>
        {!!alerts?.numUnapprovedTxs && (
          <IconSpan
            label={`${alerts.numUnapprovedTxs} unapproved transaction${alerts.numUnapprovedTxs > 1 ? "s" : ""}`}
            icon={<Circle aria-hidden fill="#2ea1be" stroke="transparent" size={16} />}
          />
        )}
        {alerts?.importError && (
          <IconSpan
            label="Import issue"
            icon={<AlertTriangle aria-hidden color="var(--stale)" size={18} />}
          />
        )}
        {alerts?.reconcile && last_reconciled_at && (
          <IconSpan
            label={`Last reconciled on ${formatDateMonthAndDay(new Date(last_reconciled_at))}`}
            icon={<LockOpen aria-hidden color="var(--stale)" size={18} />}
          />
        )}
      </div>
      <div className="flex-row">
        <CurrencyView
          milliUnits={balance}
          currencyFormat={currencyFormat}
          colorsEnabled={true}
          animationEnabled={settings.animations && !!addedTransaction}
        />
        {actionElementsRight}
      </div>
    </div>
  );
};

export default AccountsView;
