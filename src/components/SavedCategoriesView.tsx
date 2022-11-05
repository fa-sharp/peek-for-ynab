import { PinnedOff, Plus } from "tabler-icons-react";

import { IconButton } from "~components";
import { CategoryView } from "~components/CategoriesView";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { AddTransactionInitialState } from "~lib/useAddTransaction";

interface Props {
  addTx: (initialState: AddTransactionInitialState) => void;
}

/** View of user's saved categories with balances */
export default function SavedCategoriesView({ addTx }: Props) {
  const { removeCategory, settings } = useStorageContext();
  const { selectedBudgetData, savedCategoriesData } = useYNABContext();

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
            <div>
              <IconButton
                label="Remove"
                onClick={() => removeCategory(category.id)}
                icon={<PinnedOff size={20} color="gray" strokeWidth={1} />}
              />
              {settings.transactions && (
                <IconButton
                  icon={<Plus size={20} color="gray" strokeWidth={1} />}
                  label={`Add transaction to '${category.name}'`}
                  onClick={() => addTx({ categoryId: category.id })}
                />
              )}
            </div>
          }
        />
      ))}
    </section>
  );
}
