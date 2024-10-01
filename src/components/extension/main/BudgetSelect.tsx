import { Item } from "@react-stately/collections";
import { type Key, useCallback, useMemo } from "react";
import { ChevronDown } from "tabler-icons-react";

import { Menu } from "~components";
import type { CachedBudget } from "~lib/types";

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
  const currentBudgetName = useMemo(() => {
    return budgets.find((b) => b.id === selectedBudgetId)?.name;
  }, [budgets, selectedBudgetId]);

  const onSelectBudget = useCallback(
    (id: Key) => typeof id === "string" && setSelectedBudgetId(id),
    [setSelectedBudgetId]
  );

  return (
    <>
      <div
        style={{
          maxWidth: "11em",
          fontSize: "1.1em",
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
        {!selectedBudgetId || !currentBudgetName ? "Select a budget" : currentBudgetName}
      </div>
      {(!selectedBudgetId || !currentBudgetName || budgets.length > 1) && (
        <Menu
          label="Select a budget"
          placement="bottom right"
          icon={<ChevronDown aria-hidden />}
          selectionMode="single"
          selectedKeys={selectedBudgetId ? [selectedBudgetId] : []}
          onAction={onSelectBudget}>
          {budgets.map((budget) => (
            <Item key={budget.id}>{budget.name}</Item>
          ))}
        </Menu>
      )}
    </>
  );
}
