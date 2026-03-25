import "vitest-dom/extend-expect";
import { randomUUID } from "crypto";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test } from "vitest";

import { TransactionView } from "~components";
import type { TransactionDetail } from "~lib/api/client";
import type { DetailViewState } from "~lib/types";
import { getTodaysDateISO } from "~lib/utils";
import { accounts, category_groups } from "~test/mock/ynabApiData";

const amexAccount = accounts[3];
const shoppingCategory = category_groups
  .find((cg) => cg.name === "Non-Monthly")!
  .categories.find((c) => c.name.includes("Shopping"))!;
const transaction: TransactionDetail = {
  id: randomUUID(),
  account_id: amexAccount.id,
  account_name: amexAccount.name,
  category_id: shoppingCategory.id,
  category_name: shoppingCategory.name,
  amount: 200_000,
  memo: "lorem ipsum",
  approved: true,
  cleared: "uncleared",
  date: getTodaysDateISO(),
  deleted: false,
  subtransactions: [],
};

test("Shows transaction details correctly", async () => {
  const user = userEvent.setup();

  let detailState = {};

  render(
    <TransactionView
      tx={transaction}
      approve={() => Promise.resolve()}
      detailLeft="category"
      detailRight="memo"
      goToDetailView={(state) => (detailState = state)}
    />
  );
  expect(screen.queryByText(shoppingCategory.name)).toBeTruthy();
  expect(screen.queryByText(transaction.memo!)).toBeTruthy();
  expect(screen.queryByLabelText("Uncleared")).toBeTruthy();

  await user.click(screen.getByText(shoppingCategory.name));
  expect(detailState).toMatchObject({
    type: "category",
    id: transaction.category_id!,
  } satisfies DetailViewState);
});
