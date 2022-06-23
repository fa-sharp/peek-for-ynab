import { PinnedOff } from "tabler-icons-react";

import { IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";
import { formatCurrency } from "~lib/utils";

import * as styles from "./styles.module.css";

/** View of user's saved categories with balances */
export default function SavedCategoriesView() {
  const { selectedBudgetData, removeCategory } = useStorageContext();
  const { savedCategoriesData } = useYNABContext();

  if (!selectedBudgetData || !savedCategoriesData || savedCategoriesData.length === 0)
    return null;

  return (
    <section
      aria-label="Saved categories"
      style={{
        marginBottom: "1.1rem",
        display: "flex",
        flexDirection: "column",
        gap: "2px"
      }}>
      {savedCategoriesData.map(
        ({ id, budgeted, activity, balance, goal_target, name }) => (
          <div key={id} className={styles["balance-display"]}>
            <div
              title={
                `Budgeted: ${formatCurrency(
                  budgeted,
                  selectedBudgetData.currencyFormat
                )}` +
                `, Activity: ${formatCurrency(
                  activity,
                  selectedBudgetData.currencyFormat
                )}` +
                (goal_target
                  ? `, Goal: ${formatCurrency(
                      goal_target,
                      selectedBudgetData.currencyFormat
                    )}`
                  : "")
              }>
              {name}: {formatCurrency(balance, selectedBudgetData.currencyFormat)}
            </div>
            <IconButton
              label="Remove"
              onClick={() => removeCategory(id)}
              icon={<PinnedOff size={20} color="gray" strokeWidth={1} />}
            />
          </div>
        )
      )}
    </section>
  );
}
