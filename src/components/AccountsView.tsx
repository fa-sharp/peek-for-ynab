import { ReactElement, useState } from "react";
import { ChevronDown, ChevronUp, Pinned } from "tabler-icons-react";
import type { Account, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import {
  CachedBudget,
  SavedAccount,
  useStorageContext
} from "~lib/context/storageContext";
import { formatCurrency } from "~lib/utils";

import * as styles from "./styles.module.css";

/** View of all accounts in a budget, grouped by Budget / Tracking */
function AccountsView() {
  const [expanded, setExpanded] = useState(false);

  const { savedAccounts, saveAccount, selectedBudgetData } = useStorageContext();
  const { accountsData, getAccountTxs } = useYNABContext();

  if (!selectedBudgetData || !accountsData) return null;
  return (
    <>
      <div className={"heading-big"}>
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
            getAccountTxs={getAccountTxs}
          />
          <AccountTypeView
            accountType="Tracking"
            accountsData={accountsData.filter((a) => !a.on_budget)}
            savedAccounts={savedAccounts}
            saveAccount={saveAccount}
            budgetData={selectedBudgetData}
            getAccountTxs={getAccountTxs}
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
  savedAccounts
}: {
  accountType: "Budget" | "Tracking";
  accountsData: Account[];
  budgetData: CachedBudget;
  savedAccounts: SavedAccount[];
  saveAccount: (a: SavedAccount) => void;
  getAccountTxs: (accountId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="heading-medium">
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
            actionElements={
              <div>
                {/* <IconButton
                  icon={<ReportMoney size={20} color="gray" strokeWidth={1} />}
                  label="Get transactions"
                  onClick={() => getAccountTxs(account.id)}
                /> */}
                {savedAccounts.some((a) => a.accountId === account.id) ? null : (
                  <IconButton
                    icon={<Pinned size={20} color="gray" strokeWidth={1} />}
                    label="Pin"
                    onClick={() =>
                      saveAccount({ accountId: account.id, budgetId: budgetData.id })
                    }
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
  actionElements
}: {
  account: Account;
  currencyFormat?: CurrencyFormat;
  actionElements?: ReactElement | null;
}) => (
  <div className={styles["balance-display"]}>
    <div
      title={
        `Cleared: ${formatCurrency(cleared_balance, currencyFormat)}` +
        `, Uncleared: ${formatCurrency(uncleared_balance, currencyFormat)}`
      }>
      {name}:{" "}
      <CurrencyView
        milliUnits={balance}
        currencyFormat={currencyFormat}
        colorsEnabled={true}
      />
    </div>
    {actionElements}
  </div>
);

export default AccountsView;