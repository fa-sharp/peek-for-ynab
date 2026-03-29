import { Fragment } from "react";

import { AccountView, CategoryView, IconButton, IconSpan, Toolbar } from "~components";
import {
  AddCCPaymentIcon,
  AddTransactionIcon,
  DetailIcon,
  PinItemIcon,
  PinnedItemIcon,
} from "~components/icons/ActionIcons";
import type { Account, Category } from "~lib/api/client";
import type { CurrentAlerts } from "~lib/notifications";
import type { AppSettings, BudgetMainData, CachedBudget, TxAddState } from "~lib/types";
import { findCCAccount, millisToStringValue } from "~lib/utils";

interface Props {
  filtered: { accounts: Account[]; categories: Category[] };
  budget: CachedBudget;
  budgetMainData: BudgetMainData;
  settings: AppSettings;
  currentAlerts?: CurrentAlerts;
  openTxForm: (txState: TxAddState) => void;
  savedCategories?: string[];
  savedAccounts?: string[];
  editingItems?: boolean;
  onPinItem: (type: "account" | "category", id: string) => void;
  setPopupState: (state: {
    view: "detail";
    detailState: { type: "account" | "category"; id: string };
  }) => void;
}

export default function OmniboxFiltered({
  filtered,
  budget,
  budgetMainData,
  settings,
  savedCategories,
  savedAccounts,
  editingItems,
  currentAlerts,
  onPinItem,
  openTxForm,
  setPopupState,
}: Props) {
  return (
    <>
      {filtered.categories.length > 0 && (
        <div className="flex-col gap-xs">
          <h3 className="heading-medium">Categories</h3>
          {budgetMainData.categoryGroupsData
            .filter((cg) =>
              filtered.categories.some((c) => c.category_group_id === cg.id)
            )
            .map((categoryGroup) => (
              <Fragment key={categoryGroup.id}>
                <h4 className="heading-small">{categoryGroup.name}</h4>
                <ul className="list">
                  {filtered.categories
                    .filter((c) => c.category_group_id === categoryGroup.id)
                    .map((category) => {
                      const ccAccount =
                        categoryGroup.name === "Credit Card Payments"
                          ? findCCAccount(budgetMainData.accountsData, category.name)
                          : undefined;
                      return (
                        <li key={category.id}>
                          <CategoryView
                            categoryData={category}
                            settings={settings}
                            currencyFormat={budget.currencyFormat}
                            alerts={currentAlerts?.[budget.id]?.cats[category.id]}
                            actionElementsLeft={
                              !savedCategories ||
                              !editingItems ? null : savedCategories.includes(
                                  category.id
                                ) ? (
                                <IconSpan icon={<PinnedItemIcon />} label="Pinned" />
                              ) : (
                                <IconButton
                                  label="Pin"
                                  type="button"
                                  icon={<PinItemIcon />}
                                  onClick={() => onPinItem("category", category.id)}
                                />
                              )
                            }
                            actionElementsRight={
                              !ccAccount ? (
                                <Toolbar className="list flex-row gap-sm" aria-label="actions">
                                  <IconButton
                                    rounded
                                    accent
                                    icon={<AddTransactionIcon />}
                                    label="Add transaction"
                                    onClick={() => openTxForm({ categoryId: category.id })}
                                  />
                                  <IconButton
                                    accent
                                    rounded
                                    icon={<DetailIcon />}
                                    label="Details/Activity"
                                    onClick={() =>
                                      setPopupState({
                                        view: "detail",
                                        detailState: {
                                          type: "category",
                                          id: category.id,
                                        },
                                      })
                                    }
                                  />
                                </Toolbar>
                              ) : (
                                <IconButton
                                  rounded
                                  accent
                                  label="Add credit card payment"
                                  icon={<AddCCPaymentIcon />}
                                  onClick={() =>
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
                                      accountId: ccAccount.id,
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
              </Fragment>
            ))}
        </div>
      )}
      {filtered.accounts.length > 0 && (
        <div className="flex-col gap-xs">
          <h3 className="heading-medium">Accounts</h3>
          <ul className="list">
            {filtered.accounts.map((account) => (
              <li key={account.id}>
                <AccountView
                  account={account}
                  currencyFormat={budget.currencyFormat}
                  settings={settings}
                  alerts={currentAlerts?.[budget.id]?.accounts[account.id]}
                  actionElementsLeft={
                    !editingItems || !savedAccounts ? null : savedAccounts.includes(
                        account.id
                      ) ? (
                      <IconSpan icon={<PinnedItemIcon />} label="Pinned" />
                    ) : (
                      <IconButton
                        label="Pin"
                        type="button"
                        icon={<PinItemIcon />}
                        onClick={() => onPinItem("account", account.id)}
                      />
                    )
                  }
                  actionElementsRight={
                    <Toolbar className="list flex-row gap-sm" aria-label="actions">
                      <IconButton
                        rounded
                        accent
                        icon={<AddTransactionIcon />}
                        label="Add transaction"
                        onClick={() => openTxForm({ accountId: account.id })}
                      />
                      <IconButton
                        accent
                        rounded
                        icon={<DetailIcon />}
                        label="Details/Activity"
                        onClick={() =>
                          setPopupState({
                            view: "detail",
                            detailState: { type: "account", id: account.id },
                          })
                        }
                      />
                    </Toolbar>
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
