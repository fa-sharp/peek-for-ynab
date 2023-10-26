import type { ReactElement } from "react";
import { useState } from "react";
import type { Category, CategoryGroupWithCategories, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { AppSettings, TxAddInitialState } from "~lib/context/storageContext";
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
} from "./icons/ActionIcons";

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
  const { selectedBudgetData, categoryGroupsData } = useYNABContext();

  const [expanded, setExpanded] = useState(false);

  if (!selectedBudgetData || !categoryGroupsData || !savedCategories || !settings)
    return null;

  return (
    <>
      <div
        className="heading-big cursor-pointer mt-md"
        onClick={() => setExpanded(!expanded)}>
        <IconButton
          label={expanded ? "Collapse" : "Expand"}
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? CollapseListIconBold : ExpandListIconBold}
        />
        <div role="heading">Categories</div>
      </div>
      {expanded &&
        categoryGroupsData.map((categoryGroup) => (
          <CategoryGroupView
            key={categoryGroup.id}
            categoryGroup={categoryGroup}
            budgetData={selectedBudgetData}
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
  savedCategories,
  onSaveCategory,
  editMode,
  settings,
  onAddTx
}: {
  categoryGroup: CategoryGroupWithCategories;
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
          icon={expanded ? CollapseListIcon : ExpandListIcon}
        />
        <div role="heading">{categoryGroup.name}</div>
      </div>
      {expanded && (
        <ul className="list">
          {categoryGroup.categories.map((category) => (
            <li key={category.id}>
              <CategoryView
                categoryData={category}
                currencyFormat={budgetData.currencyFormat}
                settings={settings}
                actionElementsLeft={
                  !editMode ? null : savedCategories?.some((id) => id === category.id) ? (
                    <IconButton icon={PinnedItemIcon} label="Pinned" disabled noAction />
                  ) : (
                    <IconButton
                      icon={PinItemIcon}
                      label="Pin"
                      onClick={() => onSaveCategory(category.id)}
                    />
                  )
                }
                actionElementsRight={
                  categoryGroup.name === "Credit Card Payments" ? null : (
                    <aside className="balance-actions" aria-label="actions">
                      <IconButton
                        rounded
                        accent
                        icon={AddTransactionIcon}
                        label="Add transaction"
                        onClick={() => onAddTx({ categoryId: category.id })}
                      />
                    </aside>
                  )
                }
              />
            </li>
          ))}
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
  let foundEmoji = null;
  if (settings.emojiMode) foundEmoji = findEmoji(name);

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

export default CategoriesView;
