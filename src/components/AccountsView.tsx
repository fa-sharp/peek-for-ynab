import type { ReactElement } from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp, Pinned, Plus } from "tabler-icons-react";
import type { Account, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import type { AppSettings, SavedAccount } from "~lib/context/storageContext";
import { useStorageContext } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";
import type { AddTransactionInitialState } from "~lib/useAddTransaction";
import { findFirstEmoji, formatCurrency } from "~lib/utils";

interface Props {
  addTx: (initialState: AddTransactionInitialState) => void;
}

/** View of all accounts in a budget, grouped by Budget / Tracking */
function AccountsView({ addTx }: Props) {
  const { savedAccounts, selectedBudgetId, saveAccount, settings } = useStorageContext();
  const { accountsData, selectedBudgetData } = useYNABContext();

  const [expanded, setExpanded] = useState(false);

  if (!settings.showAccounts || !selectedBudgetData || !accountsData || !savedAccounts)
    return null;

  return (
    <>
      <div
        className={"heading-big cursor-pointer"}
        onClick={() => setExpanded(!expanded)}>
        <div role="heading">Accounts</div>
        <IconButton
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={
            expanded ? (
              <ChevronUp size={24} color="black" strokeWidth={2} />
            ) : (
              <ChevronDown size={24} color="black" strokeWidth={2} />
            )
          }
        />
      </div>
      {expanded && (
        <>
          <AccountTypeView
            accountType="Budget"
            accountsData={accountsData.filter((a) => a.on_budget)}
            savedAccounts={savedAccounts[selectedBudgetId]}
            saveAccount={saveAccount}
            budgetData={selectedBudgetData}
            settings={settings}
            addTx={addTx}
          />
          <AccountTypeView
            accountType="Tracking"
            accountsData={accountsData.filter((a) => !a.on_budget)}
            savedAccounts={savedAccounts[selectedBudgetId]}
            saveAccount={saveAccount}
            budgetData={selectedBudgetData}
            settings={settings}
            addTx={addTx}
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
  addTx
}: {
  accountType: "Budget" | "Tracking";
  accountsData: Account[];
  budgetData: CachedBudget;
  savedAccounts?: string[];
  saveAccount: (account: SavedAccount) => void;
  settings: AppSettings;
  addTx: (initialState: AddTransactionInitialState) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className="heading-medium heading-bordered cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <div role="heading">{accountType}</div>
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
      </div>
      {expanded &&
        accountsData.map((account) => (
          <AccountView
            key={account.id}
            account={account}
            currencyFormat={budgetData.currencyFormat}
            settings={settings}
            actionElementsLeft={
              savedAccounts?.some((id) => id === account.id) ? (
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
                  label={`Pin ${account.name}`}
                  onClick={() =>
                    saveAccount({ accountId: account.id, budgetId: budgetData.id })
                  }
                />
              )
            }
            actionElementsRight={
              <aside className="balance-actions" aria-label="actions">
                {settings.txEnabled && (
                  <IconButton
                    bordered
                    accent
                    icon={<Plus size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                    label={`Add transaction to '${account.name}'`}
                    onClick={() => addTx({ accountId: account.id })}
                  />
                )}
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
  const foundEmoji = settings.emojiMode ? findFirstEmoji(name) : null;

  return (
    <div
      className="balance-display"
      title={
        settings.emojiMode
          ? `${name}: ${formatCurrency(balance, currencyFormat)}`
          : undefined
      }>
      <div className="flex-row">
        {actionElementsLeft}
        {foundEmoji ? <span className="font-big">{foundEmoji}</span> : name}
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
