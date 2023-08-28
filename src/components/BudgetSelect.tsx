import type { CachedBudget } from "~lib/context/ynabContext";

/** Dropdown that lets the user select a budget to view */
export default function BudgetSelect({
  small,
  shownBudgets: budgets,
  selectedBudgetId,
  setSelectedBudgetId
}: {
  small?: boolean;
  shownBudgets: CachedBudget[];
  selectedBudgetId: string;
  setSelectedBudgetId: (budgetId: string) => void;
}) {
  if (budgets.length === 1 && budgets[0].id === selectedBudgetId)
    return (
      <div
        style={{
          maxWidth: small ? "6rem" : "11rem",
          marginInline: 4,
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
        {budgets[0].name}
      </div>
    );

  return (
    <select
      className="select rounded"
      aria-label="Budget selection"
      style={{
        flex: 1,
        width: "100%",
        maxWidth: small ? "6rem" : "11rem",
        fontWeight: 500,
        textOverflow: "ellipsis"
      }}
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
