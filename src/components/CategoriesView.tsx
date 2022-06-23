import { useState } from "react";
import { ChevronDown, ChevronUp, Pinned } from "tabler-icons-react";
import type { Category, CategoryGroupWithCategories, CurrencyFormat } from "ynab";

import { IconButton } from "~components";
import { useYNABContext } from "~lib/context";
import {
  CachedBudget,
  SavedCategory,
  useStorageContext
} from "~lib/context/storageContext";
import { formatCurrency } from "~lib/utils";

import * as styles from "./styles.module.css";

/** View of all categories in a budget, grouped by category groups */
function CategoriesView() {
  const { selectedBudgetData, savedCategories, saveCategory } = useStorageContext();
  const { categoryGroupsData } = useYNABContext();

  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  if (!selectedBudgetData || !categoryGroupsData) return null;

  return (
    <>
      <div className={styles["heading-big"]}>
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
      <div className={styles["heading-medium"]}>
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
  <div className={styles["balance-display"]}>
    {categoryData.name}: {formatCurrency(categoryData.balance, currencyFormat)}
    {!isSaved && (
      <IconButton
        label="Pin"
        onClick={() => onSaveCategory(categoryData.id)}
        icon={<Pinned size={20} color="gray" strokeWidth={1} />}
      />
    )}
  </div>
);

export default CategoriesView;
