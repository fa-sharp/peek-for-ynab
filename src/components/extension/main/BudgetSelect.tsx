import { Item } from "@react-stately/collections";
import { type Key, useCallback, useMemo } from "react";
import { ChevronDown } from "tabler-icons-react";

import { Menu } from "~components";
import type { CachedBudget } from "~lib/types";
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
  const currentBudgetName = useMemo(() => {
    const name = budgets.find((b) => b.id === selectedBudgetId)?.name;
    if (!name) return "";
    return emojiMode ? findEmoji(name) || name : name;
  }, [budgets, emojiMode, selectedBudgetId]);

  const onSelectBudget = useCallback(
    (id: Key) => typeof id === "string" && setSelectedBudgetId(id),
    [setSelectedBudgetId]
  );

  return (
    <>
      <div
        style={{
          maxWidth: emojiMode ? "5em" : "11em",
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
            <Item key={budget.id}>
              {emojiMode ? findEmoji(budget.name) || budget.name : budget.name}
            </Item>
          ))}
        </Menu>
      )}
    </>
  );
}
