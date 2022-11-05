import { ReactElement, useState } from "react";
import { ChevronDown, ChevronUp, Pinned, Plus } from "tabler-icons-react";
import type { Account, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import {
  AppSettings,
  SavedAccount,
  useStorageContext
} from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";
import type { AddTransactionInitialState } from "~lib/useAddTransaction";
import { findFirstEmoji, formatCurrency } from "~lib/utils";

interface Props {
  addTx: (initialState: AddTransactionInitialState) => void;
}

/** View of all accounts in a budget, grouped by Budget / Tracking */
function AccountsView({ addTx }: Props) {
  const [expanded, setExpanded] = useState(false);

  const { savedAccounts, saveAccount, settings } = useStorageContext();
  const { accountsData, selectedBudgetData } = useYNABContext();

  if (!settings.showAccounts || !selectedBudgetData || !accountsData) return null;

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
            savedAccounts={savedAccounts}
            saveAccount={saveAccount}
            budgetData={selectedBudgetData}
            settings={settings}
            addTx={addTx}
          />
          <AccountTypeView
            accountType="Tracking"
            accountsData={accountsData.filter((a) => !a.on_budget)}
            savedAccounts={savedAccounts}
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
  savedAccounts: SavedAccount[];
  saveAccount: (a: SavedAccount) => void;
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
              <ChevronUp size={24} color="gray" strokeWidth={1} />
            ) : (
              <ChevronDown size={24} color="gray" strokeWidth={1} />
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
            actionElements={
              <div>
                {savedAccounts.some((a) => a.accountId === account.id) ? null : (
                  <IconButton
                    icon={<Pinned size={20} color="gray" strokeWidth={1} />}
                    label="Pin"
                    onClick={() =>
                      saveAccount({ accountId: account.id, budgetId: budgetData.id })
                    }
                  />
                )}
                {settings.transactions && (
                  <IconButton
                    icon={<Plus size={20} color="gray" strokeWidth={1} />}
                    label="Add transaction"
                    onClick={() => addTx({ accountId: account.id })}
                  />
                )}
              </div>
            }
          />
        ))}
    </>
  );
}

export const AccountView = ({
  account: { name, balance, cleared_balance, uncleared_balance },
  currencyFormat,
  actionElements,
  settings
}: {
  account: Account;
  currencyFormat?: CurrencyFormat;
  actionElements?: ReactElement | null;
  settings: AppSettings;
}) => {
  const foundEmoji = settings.emojiMode ? findFirstEmoji(name) : null;

  return (
    <div
      className="balance-display"
      title={
        (settings.emojiMode ? `${name}:\n` : "") +
        `Cleared: ${formatCurrency(cleared_balance, currencyFormat)}` +
        `, Uncleared: ${formatCurrency(uncleared_balance, currencyFormat)}`
      }>
      <div>
        {foundEmoji ? <span className="font-big">{`${foundEmoji} `}</span> : `${name}: `}
        <CurrencyView
          milliUnits={balance}
          currencyFormat={currencyFormat}
          colorsEnabled={true}
          hideBalance={settings.privateMode}
        />
      </div>
      {actionElements}
    </div>
  );
};

export default AccountsView;
