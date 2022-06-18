import { MouseEventHandler, ReactElement, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CircleMinus,
  CirclePlus,
  Pin,
  Pinned,
  PinnedOff
} from "tabler-icons-react";
import type { Category, CategoryGroupWithCategories } from "ynab";

import type { CachedBudget, SavedCategory } from "~lib/storageContext";
import { formatCurrency } from "~lib/utils";

/** View of user's saved categories with balances */
export function SavedCategoriesView({
  budgetData,
  savedCategoryData,
  removeCategory
}: {
  budgetData: CachedBudget;
  savedCategoryData: Category[];
  removeCategory: (categoryId: string) => void;
}) {
  return (
    <section
      aria-label="Saved categories"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px"
      }}>
      {savedCategoryData.map((category) => (
        <div
          key={category.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
          <div>
            {category.name}: {formatCurrency(category.balance, budgetData.currencyFormat)}
          </div>
          <IconButton
            label="Remove"
            onClick={() => removeCategory(category.id)}
            icon={<PinnedOff size={24} color="gray" strokeWidth={1} />}
          />
        </div>
      ))}
    </section>
  );
}

/** View of a category group - can expand to show all categories and balances */
export function CategoryGroupView({
  categoryGroup,
  budgetData,
  savedCategories,
  onAddCategory
}: {
  categoryGroup: CategoryGroupWithCategories;
  budgetData: CachedBudget;
  savedCategories: Category[];
  onAddCategory: (categoryId: string) => void;
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
          <div
            key={category.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
            {category.name}: {formatCurrency(category.balance, budgetData.currencyFormat)}
            {!savedCategories.find((c) => c.id === category.id) && (
              <IconButton
                label="Add"
                onClick={() => onAddCategory(category.id)}
                icon={<Pinned size={24} color="gray" strokeWidth={1} />}
              />
            )}
          </div>
        ))}
    </>
  );
}

/** Dropdown that lets the user select a budget to view */
export function BudgetSelect({
  budgets,
  selectedBudgetId,
  setSelectedBudgetId
}: {
  budgets: CachedBudget[];
  selectedBudgetId: string;
  setSelectedBudgetId: (budgetId: string) => void;
}) {
  return (
    <select
      style={{ flex: 1 }}
      value={selectedBudgetId || "initial"}
      onChange={(e) => setSelectedBudgetId(e.target.value)}>
      {!selectedBudgetId && <option value="initial">--Select a budget--</option>}
      {budgets.map((budget) =>
        budget.show ? (
          <option key={budget.id} value={budget.id}>
            {budget.name}
          </option>
        ) : null
      )}
    </select>
  );
}

export function IconButton({
  icon,
  onClick,
  label
}: {
  label: string;
  onClick: MouseEventHandler;
  icon: ReactElement;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        lineHeight: 0,
        cursor: "pointer"
      }}>
      {icon}
    </button>
  );
}
