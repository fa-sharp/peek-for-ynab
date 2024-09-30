import type { Account, Category } from "ynab";

import { AccountView, CategoryView, IconButton } from "~components";
import { AddCCPaymentIcon, AddTransactionIcon } from "~components/icons/ActionIcons";
import type { AppSettings, TxAddInitialState } from "~lib/context/storageContext";
import type { BudgetMainData, CachedBudget } from "~lib/context/ynabContext";
import type { CurrentAlerts } from "~lib/notifications";
import { findCCAccount, millisToStringValue } from "~lib/utils";

interface Props {
  filtered: { accounts: Account[]; categories: Category[] };
  budget: CachedBudget;
  budgetMainData: BudgetMainData;
  settings: AppSettings;
  currentAlerts?: CurrentAlerts;
  openTxForm: (txState: TxAddInitialState) => void;
}

export default function OmniboxFiltered({
  filtered,
  budget,
  budgetMainData,
  settings,
  currentAlerts,
  openTxForm
}: Props) {
  return (
    <>
      {filtered.categories.length > 0 && (
        <ul aria-label="filtered categories" className="list">
          {filtered.categories.map((category) => {
            const ccAccount =
              category.category_group_name === "Credit Card Payments"
                ? findCCAccount(budgetMainData.accountsData, category.name)
                : undefined;
            return (
              <li key={category.id}>
                <CategoryView
                  categoryData={category}
                  settings={settings}
                  currencyFormat={budget.currencyFormat}
                  alerts={currentAlerts?.[budget.id]?.cats[category.id]}
                  actionElementsRight={
                    !ccAccount ? (
                      <IconButton
                        rounded
                        accent
                        icon={<AddTransactionIcon />}
                        label="Add transaction"
                        onClick={() => openTxForm({ categoryId: category.id })}
                      />
                    ) : (
                      <IconButton
                        rounded
                        accent
                        icon={<AddCCPaymentIcon />}
                        label="Add credit card payment"
                        onClick={() =>
                          ccAccount.transfer_payee_id &&
                          openTxForm({
                            isTransfer: true,
                            amount:
                              category.balance >= 0
                                ? millisToStringValue(
                                    category.balance,
                                    budget?.currencyFormat
                                  )
                                : undefined,
                            amountType: "Inflow",
                            accountId: ccAccount.id
                          })
                        }
                      />
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
      {filtered.accounts.length > 0 && (
        <ul aria-label="filtered accounts" className="list">
          {filtered.accounts.map((account) => {
            return (
              <li key={account.id}>
                <AccountView
                  account={account}
                  currencyFormat={budget.currencyFormat}
                  settings={settings}
                  alerts={currentAlerts?.[budget.id]?.accounts[account.id]}
                  actionElementsRight={
                    <IconButton
                      rounded
                      accent
                      icon={<AddTransactionIcon />}
                      label="Add transaction"
                      onClick={() => openTxForm({ accountId: account.id })}
                    />
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
