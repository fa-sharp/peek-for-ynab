import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { MoveMoney } from "~components";
import { authTokenStorage, popupStateStorage } from "~lib/state";
import { mockAuthToken } from "~test/mock/userData";
import { createTestAppWrapper } from "~test/mock/wrapper";
import { plans, category_groups } from "~test/mock/ynabApiData";

const shoppingCategory = category_groups
  .find((cg) => cg.name === "Non-Monthly")!
  .categories.find((c) => c.name.includes("Shopping"))!;

beforeEach(async () => {
  await authTokenStorage.setValue(mockAuthToken);
});

test("Sets initial 'to' category as expected", async () => {
  await popupStateStorage.setValue({
    view: "move",
    budgetId: plans[0].id,
    moveMoneyState: {
      toCategoryId: shoppingCategory.id,
    },
  });

  await act(async () => render(<MoveMoney />, { wrapper: createTestAppWrapper() }));
  await waitFor(() => screen.getByDisplayValue(shoppingCategory.name, { exact: false }));
  const toCategoryField = screen.getByLabelText<HTMLInputElement>("To", {
    selector: "input",
  });
  expect(toCategoryField.value).toContain(shoppingCategory.name);
});

test("Sets initial 'from' category as expected", async () => {
  await popupStateStorage.setValue({
    view: "move",
    budgetId: plans[0].id,
    moveMoneyState: {
      fromCategoryId: shoppingCategory.id,
    },
  });
  await act(async () => render(<MoveMoney />, { wrapper: createTestAppWrapper() }));
  await waitFor(() => screen.getByDisplayValue(shoppingCategory.name, { exact: false }));
  const fromCategoryField = screen.getByLabelText<HTMLInputElement>("From", {
    selector: "input",
  });
  expect(fromCategoryField.value).toContain(shoppingCategory.name);
});

test("Shows Ready to Assign when category field is blank", async () => {
  await popupStateStorage.setValue({
    view: "move",
    budgetId: plans[0].id,
    moveMoneyState: {
      toCategoryId: shoppingCategory.id,
    },
  });

  await act(async () => render(<MoveMoney />, { wrapper: createTestAppWrapper() }));
  await waitFor(() => screen.getByDisplayValue(shoppingCategory.name, { exact: false }));
  expect(screen.queryByText("Ready to Assign", { exact: false })).toBeTruthy();
});
