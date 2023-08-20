import { List, Pinned, Plus } from "tabler-icons-react";

import { IconButton } from "~components";
import { CategoryView } from "~components/CategoriesView";
import { useStorageContext, useYNABContext } from "~lib/context";
import type { AddTransactionInitialState } from "~lib/useAddTransaction";

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
          actionElementsLeft={
            <IconButton
              label={`Unpin '${category.name}'`}
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
              {settings.txEnabled && (
                <IconButton
                  bordered
                  accent
                  icon={<Plus size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                  label={`Add transaction to '${category.name}'`}
                  onClick={() => addTx({ categoryId: category.id })}
                />
              )}
              <IconButton
                bordered
                icon={<List size={"1.3rem"} color="var(--action)" strokeWidth={1} />}
                label={`List transactions in '${category.name}'`}
                onClick={() => listTx(category.id)}
              />
            </aside>
          }
        />
      ))}
    </section>
  );
}
