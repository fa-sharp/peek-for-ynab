import { PinnedOff } from "tabler-icons-react";
import type { Category } from "ynab";

import { IconButton } from "~components";
import type { CachedBudget } from "~lib/context/storageContext";
import { formatCurrency } from "~lib/utils";

/** View of user's saved categories with balances */
export default function SavedCategoriesView({
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
      {savedCategoryData.map(({ id, budgeted, activity, balance, goal_target, name }) => (
        <div key={id} className="balance-display">
          <div
            title={
              `Budgeted: ${formatCurrency(budgeted, budgetData.currencyFormat)}` +
              `, Activity: ${formatCurrency(activity, budgetData.currencyFormat)}` +
              (goal_target
                ? `, Goal: ${formatCurrency(goal_target, budgetData.currencyFormat)}`
                : "")
            }>
            {name}: {formatCurrency(balance, budgetData.currencyFormat)}
          </div>
          <IconButton
            label="Remove"
            onClick={() => removeCategory(id)}
            icon={<PinnedOff size={20} color="gray" strokeWidth={1} />}
          />
        </div>
      ))}
    </section>
  );
}
