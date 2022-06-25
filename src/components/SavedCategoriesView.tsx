import { PinnedOff } from "tabler-icons-react";

import { IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";

import { CategoryView } from "./CategoriesView";

/** View of user's saved categories with balances */
export default function SavedCategoriesView() {
  const { selectedBudgetData, removeCategory, settings } = useStorageContext();
  const { savedCategoriesData } = useYNABContext();

  if (!selectedBudgetData || !savedCategoriesData || savedCategoriesData.length === 0)
    return null;

  const { currencyFormat } = selectedBudgetData;

  return (
    <section
      aria-label="Saved categories"
      style={{
        marginBottom: "1.2rem",
        display: "flex",
        flexDirection: "column",
        gap: "2px"
      }}>
      {savedCategoriesData.map((category) => (
        <CategoryView
          key={category.id}
          categoryData={category}
          currencyFormat={currencyFormat}
          settings={settings}
          actionElements={
            <IconButton
              label="Remove"
              onClick={() => removeCategory(category.id)}
              icon={<PinnedOff size={20} color="gray" strokeWidth={1} />}
            />
          }
        />
      ))}
    </section>
  );
}
