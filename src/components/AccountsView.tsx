import type { ReactElement } from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp, Pinned, Plus } from "tabler-icons-react";
import type { Account, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import type {
  AppSettings,
  SavedAccount,
  TxAddInitialState
} from "~lib/context/storageContext";
import { useStorageContext } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";
import { findEmoji, formatCurrency } from "~lib/utils";

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

  if (!selectedBudgetData || !accountsData || !savedAccounts) return null;

  return (
    <>
      <div
        className={"heading-big cursor-pointer"}
        onClick={() => setExpanded(!expanded)}>
        <IconButton
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={
            expanded ? (
              <ChevronUp size={24} color="var(--action)" strokeWidth={2} />
            ) : (
              <ChevronDown size={24} color="var(--action)" strokeWidth={2} />
            )
          }
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
  saveAccount: (account: SavedAccount) => void;
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
          icon={
            expanded ? (
              <ChevronUp size={24} color="var(--action)" strokeWidth={1} />
            ) : (
              <ChevronDown size={24} color="var(--action)" strokeWidth={1} />
            )
          }
        />
        <div role="heading">{accountType}</div>
      </div>
      {expanded &&
        accountsData.map((account) => (
          <AccountView
            key={account.id}
            account={account}
            currencyFormat={budgetData.currencyFormat}
            settings={settings}
            actionElementsLeft={
              !editMode ? null : savedAccounts?.some((id) => id === account.id) ? (
                <IconButton
                  icon={
                    <Pinned
                      size={"1.3rem"}
                      color="var(--action)"
                      fill="var(--action)"
                      strokeWidth={1}
                    />
                  }
                  label="Pinned"
                  disabled
                  noAction
                />
              ) : (
                <IconButton
                  icon={<Pinned size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                  label="Pin"
                  onClick={() =>
                    saveAccount({ accountId: account.id, budgetId: budgetData.id })
                  }
                />
              )
            }
            actionElementsRight={
              <aside className="balance-actions" aria-label="actions">
                <IconButton
                  rounded
                  accent
                  icon={<Plus size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                  label="Add transaction"
                  onClick={() => onAddTx({ accountId: account.id })}
                />
              </aside>
            }
          />
        ))}
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
        settings.emojiMode
          ? `${name}: ${formatCurrency(balance, currencyFormat)}`
          : undefined
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
        />
        {actionElementsRight}
      </div>
    </div>
  );
};

export default AccountsView;
