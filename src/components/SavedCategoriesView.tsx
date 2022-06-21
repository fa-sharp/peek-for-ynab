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
      {savedCategoryData.map((category) => (
        <div
          key={category.id}
          style={{
            height: "1.6rem",
            marginBlock: "2px",
            paddingBlock: "1px",
            borderBlockEnd: "solid 1px #ddd",
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
            icon={<PinnedOff size={20} color="gray" strokeWidth={1} />}
          />
        </div>
      ))}
    </section>
  );
}
