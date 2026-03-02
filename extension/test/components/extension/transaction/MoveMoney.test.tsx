import { render, screen, waitFor } from "@testing-library/react";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { budgets, category_groups } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { MoveMoney } from "~components";
import type { PopupState } from "~lib/types";

const shoppingCategory = category_groups
  .find((cg) => cg.name === "Non-Monthly")!
  .categories.find((c) => c.name.includes("Shopping"))!;

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("Sets initial 'to' category as expected", async () => {
  await chrome.storage.local.set({
    popupState: JSON.stringify({
      view: "move",
      budgetId: budgets[0].id,
      moveMoneyState: {
        toCategoryId: shoppingCategory.id
      }
    } satisfies PopupState)
  });

  const wrapper = createTestAppWrapper();

  render(<MoveMoney />, { wrapper });
  await waitFor(() => screen.getByDisplayValue(shoppingCategory.name, { exact: false }));
  const toCategoryField = screen.getByLabelText<HTMLInputElement>("To", {
    selector: "input"
  });
  expect(toCategoryField.value).toContain(shoppingCategory.name);
});

test("Sets initial 'from' category as expected", async () => {
  await chrome.storage.local.set({
    popupState: JSON.stringify({
      view: "move",
      budgetId: budgets[0].id,
      moveMoneyState: {
        fromCategoryId: shoppingCategory.id
      }
    } satisfies PopupState)
  });
  const wrapper = createTestAppWrapper();
  render(<MoveMoney />, { wrapper });
  await waitFor(() => screen.getByDisplayValue(shoppingCategory.name, { exact: false }));
  const fromCategoryField = screen.getByLabelText<HTMLInputElement>("From", {
    selector: "input"
  });
  expect(fromCategoryField.value).toContain(shoppingCategory.name);
});

test("Shows Ready to Assign when category field is blank", async () => {
  await chrome.storage.local.set({
    popupState: JSON.stringify({
      view: "move",
      budgetId: budgets[0].id,
      moveMoneyState: {
        toCategoryId: shoppingCategory.id
      }
    } satisfies PopupState)
  });

  const wrapper = createTestAppWrapper();

  render(<MoveMoney />, { wrapper });
  await waitFor(() => screen.getByDisplayValue(shoppingCategory.name, { exact: false }));
  expect(screen.queryByText("Ready to Assign", { exact: false })).toBeTruthy();
});
