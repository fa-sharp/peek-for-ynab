import type { ReactElement } from "react";
import { useState } from "react";
import type { Account, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import {
  type AppSettings,
  type TxAddInitialState,
  useStorageContext
} from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";
import { findEmoji, formatCurrency } from "~lib/utils";

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
    selectedBudgetId,
    saveAccount,
    setPopupState,
    popupState,
    settings
  } = useStorageContext();
  const { accountsData, selectedBudgetData } = useYNABContext();

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
            savedAccounts={savedAccounts[selectedBudgetId]}
            saveAccount={saveAccount}
            editMode={popupState.editMode}
            budgetData={selectedBudgetData}
            settings={settings}
            onAddTx={(txAddState) => setPopupState({ view: "txAdd", txAddState })}
          />
          <AccountTypeView
            accountType="Tracking"
            accountsData={accountsData.filter((a) => !a.on_budget)}
            savedAccounts={savedAccounts[selectedBudgetId]}
            saveAccount={saveAccount}
            editMode={popupState.editMode}
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
  saveAccount,
  savedAccounts,
  settings,
  editMode,
  onAddTx
}: {
  accountType: "Budget" | "Tracking";
  accountsData: Account[];
  budgetData: CachedBudget;
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
  account: { name, balance },
  currencyFormat,
  actionElementsLeft,
  actionElementsRight,
  settings
}: {
  account: Account;
  currencyFormat?: CurrencyFormat;
  actionElementsLeft?: ReactElement | null;
  actionElementsRight?: ReactElement | null;
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
      </div>
      <div className="flex-row">
        <CurrencyView
          milliUnits={balance}
          currencyFormat={currencyFormat}
          colorsEnabled={true}
          hideBalance={settings.privateMode}
          animationEnabled={settings.animations ?? true}
        />
        {actionElementsRight}
      </div>
    </div>
  );
};

export default AccountsView;
