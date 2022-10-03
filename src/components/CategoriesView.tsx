import { ReactElement, useState } from "react";
import { ChevronDown, ChevronUp, Pinned } from "tabler-icons-react";
import type { Category, CategoryGroupWithCategories, CurrencyFormat } from "ynab";

import { CurrencyView, IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import {
  AppSettings,
  CachedBudget,
  SavedCategory,
  useStorageContext
} from "~lib/context/storageContext";
import { findFirstEmoji, formatCurrency } from "~lib/utils";

/** View of all categories in a budget, grouped by category groups */
function CategoriesView() {
  const { selectedBudgetData, savedCategories, saveCategory, settings } =
    useStorageContext();
  const { categoryGroupsData } = useYNABContext();

  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

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
  settings
}: {
  categoryGroup: CategoryGroupWithCategories;
  budgetData: CachedBudget;
  savedCategories: SavedCategory[];
  onSaveCategory: (categoryId: string) => void;
  settings: AppSettings;
}) {
  const [expanded, setExpanded] = useState(false);

  // skip Ready to Assign category group <div>{categoryGroup.categories[0].name}: {categoryGroup.categories[1].balance}</div>
  if (categoryGroup.name === "Internal Master Category") return null;

  return (
    <>
      <div
        className="heading-medium cursor-pointer"
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
              <div>
                {savedCategories.some((c) => c.categoryId === category.id) ? null : (
                  <IconButton
                    icon={<Pinned size={20} color="gray" strokeWidth={1} />}
                    label="Pin"
                    onClick={() => onSaveCategory(category.id)}
                  />
                )}
              </div>
            }
          />
        ))}
    </>
  );
}

export const CategoryView = ({
  categoryData: { name, budgeted, activity, balance },
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
        (settings.emojiMode ? `${name}:\n` : "") +
        `Budgeted: ${formatCurrency(budgeted, currencyFormat)}` +
        `, Activity: ${formatCurrency(activity, currencyFormat)}`
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
