import { ReactElement, useState } from "react";
import { ChevronDown, ChevronUp, Pinned, Plus } from "tabler-icons-react";
import type { Category, CategoryGroupWithCategories, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import {
  AppSettings,
  SavedCategory,
  useStorageContext
} from "~lib/context/storageContext";
import type { CachedBudget } from "~lib/context/ynabContext";
import type { AddTransactionInitialState } from "~lib/useAddTransaction";
import { findFirstEmoji, formatCurrency } from "~lib/utils";

interface Props {
  addTx: (initialState: AddTransactionInitialState) => void;
}

/** View of all categories in a budget, grouped by category groups */
function CategoriesView({ addTx }: Props) {
  const { savedCategories, saveCategory, settings } = useStorageContext();
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
            savedCategories={savedCategories}
            settings={settings}
            onSaveCategory={(id) =>
              saveCategory({ categoryId: id, budgetId: selectedBudgetData.id })
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
  savedCategories: SavedCategory[];
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
              <aside aria-label="actions">
                {settings.transactions && (
                  <IconButton
                    icon={<Plus size={20} color="gray" strokeWidth={1} />}
                    label={`Add transaction to '${category.name}'`}
                    onClick={() => addTx({ categoryId: category.id })}
                  />
                )}
                {savedCategories.some((c) => c.categoryId === category.id) ? null : (
                  <IconButton
                    icon={<Pinned size={20} color="gray" strokeWidth={1} />}
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
