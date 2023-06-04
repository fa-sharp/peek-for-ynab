import type { ReactElement } from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp, Pinned, Plus } from "tabler-icons-react";
import type { Category, CategoryGroupWithCategories, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import type { AppSettings } from "~lib/context/storageContext";
import { useStorageContext } from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";
import type { AddTransactionInitialState } from "~lib/useAddTransaction";
import { findFirstEmoji, formatCurrency } from "~lib/utils";

interface Props {
  addTx: (initialState: AddTransactionInitialState) => void;
}

/** View of all categories in a budget, grouped by category groups */
function CategoriesView({ addTx }: Props) {
  const { savedCategories, saveCategory, settings, selectedBudgetId } =
    useStorageContext();
  const { selectedBudgetData, categoryGroupsData } = useYNABContext();

  const [categoriesExpanded, setCategoriesExpanded] = useState(
    savedCategories.length ? false : true // Expanded if user hasn't pinned any categories
  );

  if (!selectedBudgetData || !categoryGroupsData) return null;

  return (
    <>
      <div
        className="heading-big cursor-pointer"
        onClick={() => setCategoriesExpanded(!categoriesExpanded)}>
        <div role="heading">Categories</div>
        <IconButton
          label={categoriesExpanded ? "Collapse" : "Expand"}
          onClick={() => setCategoriesExpanded(!categoriesExpanded)}
          icon={
            categoriesExpanded ? (
              <ChevronUp size={24} color="black" strokeWidth={2} />
            ) : (
              <ChevronDown size={24} color="black" strokeWidth={2} />
            )
          }
        />
      </div>
      {categoriesExpanded &&
        categoryGroupsData.map((categoryGroup) => (
          <CategoryGroupView
            key={categoryGroup.id}
            categoryGroup={categoryGroup}
            budgetData={selectedBudgetData}
            savedCategories={savedCategories[selectedBudgetId]}
            settings={settings}
            onSaveCategory={(categoryId) =>
              saveCategory({ categoryId, budgetId: selectedBudgetId })
            }
            addTx={addTx}
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
  settings,
  addTx
}: {
  categoryGroup: CategoryGroupWithCategories;
  budgetData: CachedBudget;
  savedCategories?: string[];
  onSaveCategory: (categoryId: string) => void;
  settings: AppSettings;
  addTx: (initialState: AddTransactionInitialState) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // skip Ready to Assign category group <div>{categoryGroup.categories[0].name}: {categoryGroup.categories[1].balance}</div>
  if (categoryGroup.name === "Internal Master Category") return null;

  return (
    <>
      <div
        className="heading-medium heading-bordered cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <div role="heading">{categoryGroup.name}</div>
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
        categoryGroup.categories.map((category) => (
          <CategoryView
            key={category.id}
            categoryData={category}
            currencyFormat={budgetData.currencyFormat}
            settings={settings}
            actionElements={
              <aside className="balance-actions" aria-label="actions">
                {settings.txEnabled && (
                  <IconButton
                    bordered
                    icon={<Plus size={"1.3rem"} color="gray" strokeWidth={1} />}
                    label={`Add transaction to '${category.name}'`}
                    onClick={() => addTx({ categoryId: category.id })}
                  />
                )}
                {savedCategories?.some((id) => id === category.id) ? null : (
                  <IconButton
                    bordered
                    icon={<Pinned size={"1.3rem"} color="gray" strokeWidth={1} />}
                    label={`Pin '${category.name}'`}
                    onClick={() => onSaveCategory(category.id)}
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
  actionElements
}: {
  categoryData: Category;
  currencyFormat?: CurrencyFormat;
  actionElements?: ReactElement | null;
  settings: AppSettings;
}) => {
  let foundEmoji = null;
  if (settings.emojiMode) foundEmoji = findFirstEmoji(name);

  return (
    <div
      className="balance-display"
      title={
        settings.emojiMode
          ? `${name}: ${formatCurrency(balance, currencyFormat)}`
          : undefined
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

export default CategoriesView;
