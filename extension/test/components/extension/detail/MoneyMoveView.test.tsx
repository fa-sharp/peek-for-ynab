import "vitest-dom/extend-expect";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test } from "vitest";

import { MoneyMoveView } from "~components";
import type { DetailViewState } from "~lib/types";
import { category_groups, money_movements, plans } from "~test/mock/ynabApiData";

const categories = category_groups.flatMap((categoryGroup) => categoryGroup.categories);
const groceryCategory = categories.find((category) => category.name === "Groceries")!;
const shoppingCategory = categories.find((category) =>
  category.name.includes("Shopping")
)!;
const noop = () => undefined;

test("Shows money move details correctly", async () => {
  const user = userEvent.setup();
  let detailState = {};

  render(
    <MoneyMoveView
      categoryId={groceryCategory.id}
      moneyMove={money_movements[0]}
      categories={categories}
      currencyFormat={plans[0].currency_format}
      goToDetailView={(state) => (detailState = state)}
    />
  );

  // expect(screen.queryByText(groceryCategory.name)).toBeTruthy();
  expect(screen.queryByText(shoppingCategory.name)).toBeTruthy();
  expect(screen.queryByText("Cover shopping")).toBeTruthy();
  expect(screen.queryByText("-$25.00")).toBeTruthy();

  await user.click(screen.getByText(shoppingCategory.name));
  expect(detailState).toMatchObject({
    type: "category",
    id: shoppingCategory.id,
  } satisfies DetailViewState);
});

test("Shows Ready to Assign for blank categories", () => {
  render(
    <MoneyMoveView
      categoryId={money_movements[1].to_category_id!}
      moneyMove={money_movements[1]}
      categories={categories}
      currencyFormat={plans[0].currency_format}
      goToDetailView={noop}
    />
  );

  expect(screen.queryByText("Ready to Assign")).toBeTruthy();
});
