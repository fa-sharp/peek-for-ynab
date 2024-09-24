import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { randomUUID } from "crypto";
import { expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { BudgetSelect } from "~components";
import type { CachedBudget } from "~lib/context/ynabContext";

const createBudgets = (): CachedBudget[] => [
  { id: randomUUID(), name: "Budget 1" },
  { id: randomUUID(), name: "Budget 2" }
];

test("can display budgets", async () => {
  const budgets = createBudgets();
  let selectedBudgetId = budgets[0].id;

  const user = userEvent.setup();
  render(
    <BudgetSelect
      selectedBudgetId={selectedBudgetId}
      setSelectedBudgetId={(id) => (selectedBudgetId = id)}
      shownBudgets={budgets}
    />
  );
  expect(screen.queryByText(budgets[0].name)).toBeTruthy();
  expect(screen.getByRole("button")).toHaveAccessibleName("Select a budget");
  await user.click(screen.getByRole("button"));

  expect(screen.queryByRole("menuitemradio", { name: budgets[0].name })).toBeTruthy();
  expect(screen.queryByRole("menuitemradio", { name: budgets[1].name })).toBeTruthy();
});

test("can switch between budgets", async () => {
  const budgets = createBudgets();
  let selectedBudgetId = budgets[0].id;

  const user = userEvent.setup();
  render(
    <BudgetSelect
      selectedBudgetId={selectedBudgetId}
      setSelectedBudgetId={(id) => {
        selectedBudgetId = id;
      }}
      shownBudgets={budgets}
    />
  );
  await user.click(screen.getByRole("button", { name: "Select a budget" }));
  await user.click(screen.getByText(budgets[1].name));

  expect(selectedBudgetId).toBe(budgets[1].id);
});
