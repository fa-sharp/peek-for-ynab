import type { ReactElement } from "react";
import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pinned, Plus } from "tabler-icons-react";
import type { Category, CategoryGroupWithCategories, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import type { AppSettings, TxAddInitialState } from "~lib/context/storageContext";
import { useStorageContext } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";
import { findEmoji, formatCurrency } from "~lib/utils";

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
  useEffect(() => {
    // auto-expand if there are no saved categories
    if (savedCategories && !savedCategories[selectedBudgetId]?.length) setExpanded(true);
  }, [savedCategories, selectedBudgetId]);

  if (!selectedBudgetData || !categoryGroupsData || !savedCategories) return null;

  return (
    <>
      <div
        className="heading-big cursor-pointer mt-md"
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
            onSaveCategory={(categoryId) =>
              saveCategory({ categoryId, budgetId: selectedBudgetId })
            }
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

  // skip Ready to Assign category group <div>{categoryGroup.categories[0].name}: {categoryGroup.categories[1].balance}</div>
  if (categoryGroup.name === "Internal Master Category") return null;

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
        <div role="heading">{categoryGroup.name}</div>
      </div>
      {expanded &&
        categoryGroup.categories.map((category) => (
          <CategoryView
            key={category.id}
            categoryData={category}
            currencyFormat={budgetData.currencyFormat}
            settings={settings}
            actionElementsLeft={
              !editMode ? null : savedCategories?.some((id) => id === category.id) ? (
                <IconButton
                  icon={
                    <Pinned
                      size="1.2rem"
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
                  icon={<Pinned size="1.2rem" color="var(--action)" strokeWidth={1} />}
                  label="Pin"
                  onClick={() => onSaveCategory(category.id)}
                />
              )
            }
            actionElementsRight={
              <aside className="balance-actions" aria-label="actions">
                {categoryGroup.name !== "Credit Card Payments" && (
                  <IconButton
                    rounded
                    accent
                    icon={<Plus size="1.2rem" color="var(--action)" strokeWidth={1} />}
                    label="Add transaction"
                    onClick={() => onAddTx({ categoryId: category.id })}
                  />
                )}
              </aside>
            }
          />
        ))}
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
