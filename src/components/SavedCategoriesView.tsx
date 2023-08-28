import { Fragment } from "react";
import { List, Pinned, Plus } from "tabler-icons-react";

import { IconButton } from "~components";
import { CategoryView } from "~components/CategoriesView";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { AddTransactionInitialState } from "~lib/usePopupState";

interface Props {
  addTx: (initialState: AddTransactionInitialState) => void;
  listTx: (categoryId: string) => void;
}

/** View of user's saved categories with balances */
export default function SavedCategoriesView({ addTx, listTx }: Props) {
  const { removeCategory, settings } = useStorageContext();
  const { selectedBudgetData, savedCategoriesData } = useYNABContext();

  if (!selectedBudgetData || !savedCategoriesData || savedCategoriesData.length === 0)
    return null;

  const { currencyFormat } = selectedBudgetData;

  return (
    <section aria-label="Saved categories" className="flex-col gap-0">
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
                  icon={<List size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                  label={`List transactions in '${category.name}'`}
                  onClick={() => listTx(category.id)}
                />
                {settings.txEnabled && (
                  <IconButton
                    rounded
                    accent
                    icon={<Plus size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                    label="Add transaction"
                    onClick={() => addTx({ categoryId: category.id })}
                  />
                )}
              </aside>
            }
          />
          {idx !== savedCategoriesData.length - 1 && <div className="sep-line-h"></div>}
        </Fragment>
      ))}
    </section>
  );
}
