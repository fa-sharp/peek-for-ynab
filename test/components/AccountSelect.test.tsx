import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";
import type { Account } from "ynab";

import { AccountSelect } from "~components";
import { useYNABContext } from "~lib/context";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("Mouse behavior works as expected", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(useYNABContext, { wrapper });
  await waitFor(() => expect(result.current.accountsData).toBeTruthy());

  const user = userEvent.setup();
  let selectedAccount: Account | null = null;
  render(
    <AccountSelect
      selectAccount={(a) => (selectedAccount = a)}
      accounts={result.current.accountsData}
    />,
    { wrapper }
  );

  expect(screen.getByRole("listbox"), "No list appears initially").toBeEmptyDOMElement();
  await user.click(screen.getByRole("combobox"));
  expect(
    screen.getByRole("listbox").children,
    "Account list appears on click"
  ).toHaveLength(3);

  const checkingAcct = screen.getByRole("listbox").children[1];
  expect(checkingAcct).toHaveTextContent("Checking");
  await user.hover(checkingAcct);
  expect(checkingAcct, "Highlights account on hover").toHaveClass("highlighted");
  await user.click(checkingAcct);
  expect(selectedAccount, "Selects the proper account on click").toMatchObject({
    id: "b04cde9d-a0f7-4ed0-bf82-b44a3c4de92e"
  });
});

test("Keyboard behavior works as expected", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(useYNABContext, { wrapper });
  await waitFor(() => expect(result.current.accountsData).toBeTruthy());

  const user = userEvent.setup();
  let selectedAccount: Account | null = null;
  render(
    <AccountSelect
      selectAccount={(a) => (selectedAccount = a)}
      accounts={result.current.accountsData}
    />,
    { wrapper }
  );

  expect(screen.getByRole("listbox"), "No list appears initially").toBeEmptyDOMElement();

  await user.keyboard("{Tab}");
  expect(screen.getByRole("combobox"), "Tab key focuses on combobox").toHaveFocus();
  expect(screen.getByRole("listbox"), "No list after tab key").toBeEmptyDOMElement();

  await user.keyboard("{ArrowDown}");
  expect(
    screen.getByRole("listbox").children,
    "Account list appears on down arrow"
  ).toHaveLength(3);
  const checkingAcct = screen.getByRole("listbox").children[1];
  expect(checkingAcct, "First account highlighted on down arrow").toHaveClass(
    "highlighted"
  );
  await user.keyboard("{Enter}");
  expect(selectedAccount, "Enter key selects the proper account").toMatchObject({
    id: "b04cde9d-a0f7-4ed0-bf82-b44a3c4de92e"
  });
});

test("Filtering works as expected", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(useYNABContext, { wrapper });
  await waitFor(() => expect(result.current.accountsData).toBeTruthy());

  const user = userEvent.setup();
  let selectedAccount: Account | null = null;
  render(
    <AccountSelect
      selectAccount={(c) => (selectedAccount = c)}
      accounts={result.current.accountsData}
    />,
    { wrapper }
  );

  await user.keyboard("{Tab}savings");
  expect(screen.getByRole("listbox").children[0]).toHaveTextContent("Budget");
  expect(screen.getByRole("listbox").children[1]).toHaveTextContent("Savings");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(selectedAccount).toMatchObject({ id: "3857871b-1a41-45b9-81e6-d60ad2d093ba" });
});
