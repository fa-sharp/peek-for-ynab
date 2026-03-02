import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { accounts } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";
import type { Account } from "ynab";

import { AccountSelect } from "~components";
import { useYNABContext } from "~lib/context";

const checkingAccount = accounts.find((a) => a.name === "Checking")!;
const savingsAccount = accounts.find((a) => a.name === "Savings")!;

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
  ).toHaveLength(6);

  const checkingAccountListItem = screen.getByRole("listbox").children[1];
  expect(checkingAccountListItem).toHaveTextContent(checkingAccount.name);
  await user.hover(checkingAccountListItem);
  expect(checkingAccountListItem, "Highlights account on hover").toHaveClass(
    "highlighted"
  );
  await user.click(checkingAccountListItem);
  expect(selectedAccount, "Selects the proper account on click").toMatchObject(
    checkingAccount
  );
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
  ).toHaveLength(6);
  const checkingAccountListItem = screen.getByRole("listbox").children[1];
  expect(
    checkingAccountListItem,
    "First budget account highlighted on down arrow"
  ).toHaveClass("highlighted");
  await user.keyboard("{Enter}");
  expect(selectedAccount, "Enter key selects the proper account").toMatchObject(
    checkingAccount
  );
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
  expect(screen.getByRole("listbox").children[1]).toHaveTextContent(savingsAccount.name);
  await user.keyboard("{ArrowDown}{Enter}");
  expect(selectedAccount).toMatchObject(savingsAccount);
});

test("Clear button works as expected", async () => {
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

  expect(selectedAccount).toBeNull();
  await user.keyboard("{Tab}{ArrowDown}{Enter}");
  expect(selectedAccount).toMatchObject(checkingAccount);

  await user.click(screen.getByLabelText("Clear account"));
  expect(selectedAccount).toBeNull();
});
