import { Fragment } from "react";
import { Pinned, Plus } from "tabler-icons-react";

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
    <section aria-label="Saved categories">
      {savedCategoriesData.map((category, idx) => (
        <Fragment key={category.id}>
          <CategoryView
            categoryData={category}
            currencyFormat={currencyFormat}
            settings={settings}
            actionElementsLeft={
              <IconButton
                label="Unpin"
                onClick={() =>
                  removeCategory({
                    categoryId: category.id,
                    budgetId: selectedBudgetData.id
                  })
                }
                icon={
                  <Pinned
                    size={"1.3rem"}
                    fill="var(--action)"
                    color="var(--action)"
                    strokeWidth={1}
                  />
                }
              />
            }
            actionElementsRight={
              <aside className="balance-actions" aria-label="actions">
                <IconButton
                  rounded
                  accent
                  icon={<Plus size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                  label="Add transaction"
                  onClick={() => addTx({ categoryId: category.id })}
                />
              </aside>
            }
          />
          {idx !== savedCategoriesData.length - 1 && <div className="sep-line-h"></div>}
        </Fragment>
      ))}
    </section>
  );
}
