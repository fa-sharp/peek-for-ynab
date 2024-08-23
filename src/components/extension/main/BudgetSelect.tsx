import type { CachedBudget } from "~lib/context/ynabContext";
import { findEmoji } from "~lib/utils";

/** Dropdown that lets the user select a budget to view */
export default function BudgetSelect({
  emojiMode,
  shownBudgets: budgets,
  selectedBudgetId,
  setSelectedBudgetId
}: {
  emojiMode?: boolean;
  shownBudgets: CachedBudget[];
  selectedBudgetId: string;
  setSelectedBudgetId: (budgetId: string) => void;
}) {
  if (budgets.length === 1 && budgets[0].id === selectedBudgetId)
    return (
      <div
        style={{
          maxWidth: emojiMode ? "5em" : "11em",
          marginInline: 4,
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
        {emojiMode ? findEmoji(budgets[0].name) || budgets[0].name : budgets[0].name}
      </div>
    );

  return (
    <select
      className="select rounded"
      aria-label="Budget selection"
      style={{
        flex: 1,
        maxWidth: emojiMode ? "5em" : "11em",
        fontWeight: 500,
        textOverflow: "ellipsis"
      }}
      value={selectedBudgetId || "initial"}
      onChange={(e) => setSelectedBudgetId(e.target.value)}>
      {!selectedBudgetId && <option value="initial">--Select a budget--</option>}
      {budgets.map((budget) => (
        <option key={budget.id} value={budget.id}>
          {emojiMode ? findEmoji(budget.name) || budget.name : budget.name}
        </option>
      ))}
    </select>
  );
}
