import { useState } from "react";
import { ChevronDown, ChevronUp, Pinned } from "tabler-icons-react";
import type { Category, CategoryGroupWithCategories, CurrencyFormat } from "ynab";

import { IconButton } from "~components";
import type { CachedBudget, SavedCategory } from "~lib/storageContext";
import { formatCurrency } from "~lib/utils";

/** View of all categories in a budget, grouped by category groups */
function CategoriesView({
  categoryGroupsData,
  selectedBudgetData,
  savedCategories,
  saveCategory
}: {
  savedCategories: SavedCategory[];
  categoryGroupsData: CategoryGroupWithCategories[];
  selectedBudgetData: CachedBudget;
  saveCategory: (category: SavedCategory) => void;
}) {
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  return (
    <>
      <h3
        style={{
          marginTop: 8,
          marginBottom: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
        Categories
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
      </h3>
      {categoriesExpanded &&
        categoryGroupsData.map((categoryGroup) => (
          <CategoryGroupView
            key={categoryGroup.id}
            categoryGroup={categoryGroup}
            budgetData={selectedBudgetData}
            savedCategories={savedCategories}
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
  onSaveCategory
}: {
  categoryGroup: CategoryGroupWithCategories;
  budgetData: CachedBudget;
  savedCategories: SavedCategory[];
  onSaveCategory: (categoryId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // skip Ready to Assign category group <div>{categoryGroup.categories[0].name}: {categoryGroup.categories[1].balance}</div>
  if (categoryGroup.name === "Internal Master Category") return null;

  return (
    <>
      <h4
        style={{
          marginBlock: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
        {categoryGroup.name}
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
      </h4>
      {expanded &&
        categoryGroup.categories.map((category) => (
          <CategoryView
            key={category.id}
            categoryData={category}
            isSaved={savedCategories.some((c) => c.categoryId === category.id)}
            onSaveCategory={onSaveCategory}
            currencyFormat={budgetData.currencyFormat}
          />
        ))}
    </>
  );
}

const CategoryView = ({
  categoryData,
  isSaved,
  currencyFormat,
  onSaveCategory
}: {
  categoryData: Category;
  currencyFormat?: CurrencyFormat;
  isSaved: boolean;
  onSaveCategory: (categoryId: string) => void;
}) => (
  <div
    key={categoryData.id}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBlock: "2px"
    }}>
    {categoryData.name}: {formatCurrency(categoryData.balance, currencyFormat)}
    {!isSaved && (
      <IconButton
        label="Add"
        onClick={() => onSaveCategory(categoryData.id)}
        icon={<Pinned size={20} color="gray" strokeWidth={1} />}
      />
    )}
  </div>
);

export default CategoriesView;
