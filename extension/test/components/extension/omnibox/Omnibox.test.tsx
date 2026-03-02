import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { accounts, category_groups } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { Omnibox } from "~components";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

const eatingOutCategory = category_groups[3].categories[1];
const amexAccount = accounts[3];

test("Can filter categories and accounts", async () => {
  const wrapper = createTestAppWrapper();

  render(<Omnibox />, { wrapper });
  await waitFor(() => screen.getByRole("textbox"));

  const user = userEvent.setup();
  const input = screen.getByRole("textbox");
  await user.tab();
  expect(input).toHaveFocus();

  expect(screen.queryByText(eatingOutCategory.name)).toBeFalsy();
  await user.keyboard("eating");
  expect(screen.queryByText(eatingOutCategory.name)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Add transaction" })).toBeTruthy();

  await user.keyboard("{Backspace>6}");
  expect(screen.queryByText(amexAccount.name)).toBeFalsy();
  await user.keyboard("amex");
  expect(screen.queryAllByText(amexAccount.name)[0], "CCP category").toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Credit Card Payments" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Add credit card payment" })).toBeTruthy();
  expect(screen.queryAllByText(amexAccount.name)[1], "Account").toBeTruthy();
  expect(screen.queryByRole("button", { name: "Add transaction" })).toBeTruthy();
});
