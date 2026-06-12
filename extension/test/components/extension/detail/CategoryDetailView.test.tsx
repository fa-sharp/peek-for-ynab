import { act, render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { CategoryDetailView } from "~components";
import { authTokenStorage, appSettingsStorage, popupStateStorage } from "~lib/state";
import { DEFAULT_SETTINGS } from "~lib/constants";
import { mockAuthToken } from "~test/mock/userData";
import { createTestAppWrapper } from "~test/mock/wrapper";
import { category_groups, plans } from "~test/mock/ynabApiData";

const categories = category_groups.flatMap((categoryGroup) => categoryGroup.categories);
const groceryCategory = categories.find((category) => category.name === "Groceries")!;
const shoppingCategory = categories.find((category) => category.name.includes("Shopping"))!;

beforeEach(async () => {
  await authTokenStorage.setValue(mockAuthToken);
  await appSettingsStorage("local").setValue({
    ...DEFAULT_SETTINGS,
    budgets: [plans[0].id],
  });
  await popupStateStorage.setValue({
    view: "detail",
    budgetId: plans[0].id,
    detailState: {
      type: "category",
      id: shoppingCategory.id,
    },
  });
});

test("Shows money moves for the selected category", async () => {
  const user = userEvent.setup();
  const wrapper = createTestAppWrapper();

  await act(async () => render(<CategoryDetailView />, { wrapper }));

  await waitFor(() => screen.getByText("Money Moves"));
  await waitFor(() => screen.getByText("Cover shopping"));

  expect(screen.queryByText("Ready to Assign")).toBeTruthy();
  expect(screen.queryByText("Unrelated move")).toBeNull();

  await user.click(screen.getByText(groceryCategory.name));
  await waitFor(async () =>
    expect(await popupStateStorage.getValue()).toMatchObject({
      view: "detail",
      detailState: {
        type: "category",
        id: groceryCategory.id,
      },
    })
  );
});
