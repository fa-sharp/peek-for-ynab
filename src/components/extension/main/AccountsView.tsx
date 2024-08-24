import type { ReactElement } from "react";
import { useState } from "react";
import { AlertTriangle, LockOpen } from "tabler-icons-react";
import { type Account, type CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import type { AccountAlerts } from "~lib/notifications";
import type {
  AppSettings,
  CachedBudget,
  DetailViewState,
  TxAddInitialState
} from "~lib/types";
import { findEmoji, formatCurrency, formatDateMonthAndDay } from "~lib/utils";

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
function AccountsView() {
  const {
    savedAccounts,
    selectedBudgetId,
    saveAccount,
    setPopupState,
    popupState,
    settings
  } = useStorageContext();
  const { accountsData, selectedBudgetData } = useYNABContext();
  const { currentAlerts } = useNotificationsContext();

  const [expanded, setExpanded] = useState(false);

  if (!selectedBudgetData || !accountsData || !savedAccounts || !settings) return null;

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
            accountAlerts={currentAlerts?.[selectedBudgetId]?.accounts}
            savedAccounts={savedAccounts[selectedBudgetId]}
            saveAccount={saveAccount}
            editMode={popupState.editMode}
            budgetData={selectedBudgetData}
            settings={settings}
            onAddTx={(txAddState) => setPopupState({ view: "txAdd", txAddState })}
            onOpenDetail={(detailState) => setPopupState({ view: "detail", detailState })}
          />
          <AccountTypeView
            accountType="Tracking"
            accountsData={accountsData.filter((a) => !a.on_budget)}
            accountAlerts={currentAlerts?.[selectedBudgetId]?.accounts}
            savedAccounts={savedAccounts[selectedBudgetId]}
            saveAccount={saveAccount}
            editMode={popupState.editMode}
            budgetData={selectedBudgetData}
            settings={settings}
            onAddTx={(txAddState) => setPopupState({ view: "txAdd", txAddState })}
            onOpenDetail={(detailState) => setPopupState({ view: "detail", detailState })}
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
  onAddTx,
  onOpenDetail
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
  onOpenDetail: (detailState: DetailViewState) => void;
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
                    <IconButton
                      icon={<PinnedItemIcon />}
                      label="Pinned"
                      disabled
                      noAction
                    />
                  ) : (
                    <IconButton
                      icon={<PinItemIcon />}
                      label="Pin"
                      onClick={() => saveAccount(account.id)}
                    />
                  )
                }
                actionElementsRight={
                  <aside className="flex-row gap-sm" aria-label="actions">
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
                        onOpenDetail({
                          type: "account",
                          id: account.id
                        })
                      }
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
  account: { name, balance, last_reconciled_at },
  currencyFormat,
  actionElementsLeft,
  actionElementsRight,
  alerts,
  settings
}: {
  account: Account;
  currencyFormat?: CurrencyFormat;
  actionElementsLeft?: ReactElement | null;
  actionElementsRight?: ReactElement | null;
  alerts?: AccountAlerts[string];
  settings: AppSettings;
}) => {
  const foundEmoji = settings.emojiMode ? findEmoji(name) : null;

  return (
    <div
      className="balance-display"
      title={
        foundEmoji ? `${name}: ${formatCurrency(balance, currencyFormat)}` : undefined
      }>
      <div className="flex-row min-w-0">
        {actionElementsLeft}
        {foundEmoji ? (
          <span className="font-big">{foundEmoji}</span>
        ) : (
          <div className="hide-overflow">{name}</div>
        )}
        {alerts?.importError && (
          <IconButton
            noAction
            disabled
            label="Import issue/error"
            icon={<AlertTriangle color="var(--stale)" size={18} />}
          />
        )}
        {alerts?.reconcile && last_reconciled_at && (
          <IconButton
            noAction
            disabled
            label={`Last reconciled on ${formatDateMonthAndDay(new Date(last_reconciled_at))}`}
            icon={<LockOpen color="var(--stale)" size={18} />}
          />
        )}
      </div>
      <div className="flex-row">
        <CurrencyView
          milliUnits={balance}
          currencyFormat={currencyFormat}
          colorsEnabled={true}
          animationEnabled={settings.animations}
        />
        {actionElementsRight}
      </div>
    </div>
  );
};

export default AccountsView;
