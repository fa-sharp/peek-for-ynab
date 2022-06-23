import { PinnedOff } from "tabler-icons-react";

import { IconButton } from "~components";
import { useStorageContext, useYNABContext } from "~lib/context";
import { formatCurrency } from "~lib/utils";

import CurrencyView from "./CurrencyView";
import * as styles from "./styles.module.css";

/** View of user's saved categories with balances */
export default function SavedCategoriesView() {
  const { selectedBudgetData, removeCategory } = useStorageContext();
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
      {savedCategoriesData.map(({ id, budgeted, activity, balance, name }) => (
        <div key={id} className={styles["balance-display"]}>
          <div
            title={
              `Budgeted: ${formatCurrency(budgeted, currencyFormat)}` +
              `, Activity: ${formatCurrency(activity, currencyFormat)}`
            }>
            {name}:{" "}
            <CurrencyView
              milliUnits={balance}
              currencyFormat={currencyFormat}
              colorsEnabled={true}
            />
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
