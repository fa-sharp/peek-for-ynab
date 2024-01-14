import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { randomUUID } from "crypto";
import { afterEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { BudgetSelect } from "~components";
import type { CachedBudget } from "~lib/context/ynabContext";

afterEach(() => {
  cleanup();
});

const createBudgets = (): CachedBudget[] => [
  { id: randomUUID(), name: "Budget 1" },
  { id: randomUUID(), name: "Budget 2" }
];

test("can display budgets", async () => {
  const budgets = createBudgets();
  let selectedBudgetId = budgets[0].id;

  render(
    <BudgetSelect
      selectedBudgetId={selectedBudgetId}
      setSelectedBudgetId={(id) => (selectedBudgetId = id)}
      shownBudgets={budgets}
    />
  );
  expect(screen.getByRole("combobox")).toHaveTextContent("Budget 1");
  expect(screen.getByRole("combobox")).toHaveValue(budgets[0].id);

  const options = screen.getAllByRole("option");
  expect(options).toHaveLength(2);

  const option2 = options.find((option) => option.textContent === budgets[1].name);
  expect(option2).toBeTruthy();
  expect(option2).toHaveValue(budgets[1].id);
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
  const input: HTMLSelectElement = screen.getByRole("combobox");
  const option2 = screen.getByRole("option", {
    name: "Budget 2"
  });
  await user.selectOptions(input, option2);

  expect(selectedBudgetId).toBe(budgets[1].id);
});
