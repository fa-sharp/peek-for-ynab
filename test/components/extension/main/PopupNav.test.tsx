import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { budgets } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { PopupNav } from "~components";
import { useStorageContext } from "~lib/context";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken),
    budgets: JSON.stringify([budgets[0].id, budgets[1].id])
  });
});

test("Can switch between budgets", async () => {
  const wrapper = createTestAppWrapper();
  const user = userEvent.setup();
  const { result } = renderHook(useStorageContext, { wrapper });
  render(<PopupNav />, { wrapper });

  await waitFor(() => expect(screen.getByRole("combobox")).toHaveValue("initial"));

  await user.selectOptions(screen.getByRole("combobox"), budgets[0].id);

  await waitFor(() => expect(result.current.selectedBudgetId).toBe(budgets[0].id));
  expect(screen.getByRole("combobox")).toHaveTextContent(budgets[0].name);
  expect(screen.getByRole("combobox")).toHaveValue(budgets[0].id);

  await user.click(screen.getByLabelText("Next budget"));
  await waitFor(() => expect(result.current.selectedBudgetId).toBe(budgets[1].id));
  expect(screen.getByRole("combobox")).toHaveTextContent(budgets[1].name);
  expect(screen.getByRole("combobox")).toHaveValue(budgets[1].id);

  await user.click(screen.getByLabelText("Next budget"));
  await waitFor(() => expect(result.current.selectedBudgetId).toBe(budgets[0].id));
  expect(screen.getByRole("combobox")).toHaveTextContent(budgets[0].name);
  expect(screen.getByRole("combobox")).toHaveValue(budgets[0].id);
});
