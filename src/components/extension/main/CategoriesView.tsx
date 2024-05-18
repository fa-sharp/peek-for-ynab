import type { ReactElement } from "react";
import { useState } from "react";
import type {
  Account,
  Category,
  CategoryGroupWithCategories,
  CurrencyFormat
} from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { AppSettings, TxAddInitialState } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";
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
    settings,
    selectedBudgetId
  } = useStorageContext();
  const { selectedBudgetData, accountsData, categoryGroupsData } = useYNABContext();

  const [expanded, setExpanded] = useState(false);

  if (!selectedBudgetData || !categoryGroupsData || !savedCategories || !settings)
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
            budgetData={selectedBudgetData}
            accountsData={accountsData}
            savedCategories={savedCategories[selectedBudgetId]}
            editMode={popupState.editMode}
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
  budgetData,
  accountsData,
  savedCategories,
  onSaveCategory,
  editMode,
  settings,
  onAddTx
}: {
  categoryGroup: CategoryGroupWithCategories;
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
                  settings={settings}
                  actionElementsLeft={
                    !editMode ? null : savedCategories?.some(
                        (id) => id === category.id
                      ) ? (
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
  categoryData: { name, balance },
  currencyFormat,
  settings,
  actionElementsRight,
  actionElementsLeft
}: {
  categoryData: Category;
  currencyFormat?: CurrencyFormat;
  actionElementsRight?: ReactElement | null;
  actionElementsLeft?: ReactElement | null;
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
          animationEnabled={settings.animations}
        />
        {actionElementsRight}
      </div>
    </div>
  );
};

export default CategoriesView;
