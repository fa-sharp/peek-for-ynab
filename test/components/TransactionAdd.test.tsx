import { render, screen, waitFor } from "@testing-library/react";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { budgets } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { TransactionAdd } from "~components";
import PopupMain from "~components/PopupMain";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("Respects default account setting", async () => {
  await chrome.storage.local.set({
    [`budget-${budgets[0].id}`]: JSON.stringify({
      defaultAccountId: "509fec7a-f582-4fc7-8fa3-a133d6aae076"
    })
  });

  const wrapper = createTestAppWrapper();
  const { rerender } = render(<PopupMain />, { wrapper });
  await waitFor(() => expect(screen.queryByText("Accounts")).toBeTruthy());
  rerender(<TransactionAdd />);

  const accountField = screen.getByRole("combobox", { name: "Account" });
  expect(accountField).toHaveValue("💳 Amex Blue Cash (-$130.00)");
});
