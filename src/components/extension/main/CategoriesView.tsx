import { clsx } from "clsx";
import type { ReactElement } from "react";
import { useState } from "react";
import { AlertTriangle } from "tabler-icons-react";
import type {
  Account,
  Category,
  CategoryGroupWithCategories,
  CurrencyFormat,
  TransactionDetail
} from "ynab";

import { CurrencyView, IconButton, IconSpan } from "~components";
import { useNotificationsContext, useStorageContext, useYNABContext } from "~lib/context";
import type { AppSettings, TxAddInitialState } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";
import type { CategoryAlerts } from "~lib/notifications";
import {
  findCCAccount,
  findEmoji,
  formatCurrency,
  millisToStringValue
} from "~lib/utils";

import {
  AddCCPaymentIcon,
  AddTransactionIcon,
  CollapseListIcon,
  CollapseListIconBold,
  ExpandListIcon,
  ExpandListIconBold,
  PinItemIcon,
  PinnedItemIcon
} from "../../icons/ActionIcons";

/** View of all categories in a budget, grouped by category groups */
function CategoriesView() {
  const {
    savedCategories,
    saveCategory,
    setPopupState,
    popupState,
    editingItems,
    settings
  } = useStorageContext();
  const { selectedBudgetData, accountsData, categoryGroupsData } = useYNABContext();
  const { currentAlerts } = useNotificationsContext();

  const [expanded, setExpanded] = useState(false);

  if (
    !popupState ||
    !selectedBudgetData ||
    !categoryGroupsData ||
    !savedCategories ||
    !settings
  )
    return null;

  return (
    <>
      <div className="heading-big cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <IconButton
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? <CollapseListIconBold /> : <ExpandListIconBold />}
        />
        <div role="heading">Categories</div>
      </div>
      {expanded &&
        categoryGroupsData.map((categoryGroup) => (
          <CategoryGroupView
            key={categoryGroup.id}
            categoryGroup={categoryGroup}
            categoryAlerts={currentAlerts?.[selectedBudgetData.id]?.cats}
            budgetData={selectedBudgetData}
            accountsData={accountsData}
            savedCategories={savedCategories[selectedBudgetData.id]}
            editMode={editingItems}
            settings={settings}
            onSaveCategory={(categoryId) => saveCategory(categoryId)}
            onAddTx={(txAddState) => setPopupState({ view: "txAdd", txAddState })}
          />
        ))}
    </>
  );
}

/** View of a category group - can expand to show all categories and balances */
export function CategoryGroupView({
  categoryGroup,
  categoryAlerts,
  budgetData,
  accountsData,
  savedCategories,
  onSaveCategory,
  editMode,
  settings,
  onAddTx
}: {
  categoryGroup: CategoryGroupWithCategories;
  categoryAlerts?: CategoryAlerts;
  accountsData?: Account[];
  budgetData: CachedBudget;
  savedCategories?: string[];
  onSaveCategory: (categoryId: string) => void;
  editMode?: boolean;
  settings: AppSettings;
  onAddTx: (initialState: TxAddInitialState) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Skip Ready to Assign category group
  if (categoryGroup.name === "Internal Master Category") return null;

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
        <div role="heading">{categoryGroup.name}</div>
      </div>
      {expanded && (
        <ul className="list">
          {categoryGroup.categories.map((category) => {
            /** The corresponding credit card account, if this is a CCP category */
            const ccAccount =
              categoryGroup.name === "Credit Card Payments" && accountsData
                ? findCCAccount(accountsData, category.name)
                : undefined;
            return (
              <li key={category.id}>
                <CategoryView
                  categoryData={category}
                  currencyFormat={budgetData.currencyFormat}
                  alerts={categoryAlerts?.[category.id]}
                  settings={settings}
                  actionElementsLeft={
                    !editMode ? null : savedCategories?.some(
                        (id) => id === category.id
                      ) ? (
                      <IconSpan icon={<PinnedItemIcon />} label="Pinned" />
                    ) : (
                      <IconButton
                        icon={<PinItemIcon />}
                        label="Pin"
                        onClick={() => onSaveCategory(category.id)}
                      />
                    )
                  }
                  actionElementsRight={
                    <aside className="balance-actions" aria-label="actions">
                      {!ccAccount ? (
                        <IconButton
                          rounded
                          accent
                          icon={<AddTransactionIcon />}
                          label="Add transaction"
                          onClick={() => onAddTx({ categoryId: category.id })}
                        />
                      ) : (
                        <IconButton
                          rounded
                          accent
                          icon={<AddCCPaymentIcon />}
                          label="Add credit card payment"
                          onClick={() =>
                            ccAccount.transfer_payee_id &&
                            onAddTx({
                              isTransfer: true,
                              amount:
                                category.balance >= 0
                                  ? millisToStringValue(
                                      category.balance,
                                      budgetData.currencyFormat
                                    )
                                  : undefined,
                              amountType: "Inflow",
                              accountId: ccAccount.id
                            })
                          }
                        />
                      )}
                    </aside>
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

export const CategoryView = ({
  categoryData: { id, name, balance },
  currencyFormat,
  settings,
  alerts,
  actionElementsRight,
  actionElementsLeft,
  addedTransaction
}: {
  categoryData: Category;
  currencyFormat?: CurrencyFormat;
  actionElementsRight?: ReactElement | null;
  actionElementsLeft?: ReactElement | null;
  alerts?: CategoryAlerts[string];
  settings: AppSettings;
  addedTransaction?: TransactionDetail | null;
}) => {
  const foundEmoji = settings.emojiMode ? findEmoji(name) : null;

  return (
    <div
      className={clsx("balance-display", {
        highlighted: settings.animations && addedTransaction?.category_id === id
      })}
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
        {alerts?.overspent && (
          <IconSpan
            label="Overspent"
            icon={<AlertTriangle color="var(--stale)" size={18} aria-hidden />}
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

export default CategoriesView;
