import type { CachedBudget } from "~lib/context/storageContext";

/** Dropdown that lets the user select a budget to view */
export default function BudgetSelect({
  shownBudgets: budgets,
  selectedBudgetId,
  setSelectedBudgetId
}: {
  shownBudgets: CachedBudget[];
  selectedBudgetId: string;
  setSelectedBudgetId: (budgetId: string) => void;
}) {
  return (
    <select
      aria-label="Budget selection"
      style={{ flex: 1, width: "100%" }}
      value={selectedBudgetId || "initial"}
      onChange={(e) => setSelectedBudgetId(e.target.value)}>
      {!selectedBudgetId && <option value="initial">--Select a budget--</option>}
      {budgets.map((budget) => (
        <option key={budget.id} value={budget.id}>
          {budget.name}
        </option>
      ))}
    </select>
  );
}
