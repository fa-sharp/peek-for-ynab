import { useState } from "react";
import { ChevronDown, ChevronUp } from "tabler-icons-react";
import type { Account, CurrencyFormat } from "ynab";

import { IconButton } from "~components";
import type { CachedBudget } from "~lib/context/storageContext";
import { formatCurrency } from "~lib/utils";

import "./style.css";

/** View of all accounts in a budget, grouped by Budget / Tracking */
function AccountsView({
  accountsData,
  selectedBudgetData
}: {
  accountsData: Account[];
  selectedBudgetData: CachedBudget;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="heading-big">
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
            budgetData={selectedBudgetData}
          />
          <AccountTypeView
            accountType="Tracking"
            accountsData={accountsData.filter((a) => !a.on_budget)}
            budgetData={selectedBudgetData}
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
  budgetData
}: {
  accountType: "Budget" | "Tracking";
  accountsData: Account[];
  budgetData: CachedBudget;
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
          />
        ))}
    </>
  );
}

const AccountView = ({
  account,
  currencyFormat
}: {
  account: Account;
  currencyFormat?: CurrencyFormat;
}) => (
  <div className="balance-display">
    {account.name}: {formatCurrency(account.balance, currencyFormat)}
  </div>
);

export default AccountsView;
