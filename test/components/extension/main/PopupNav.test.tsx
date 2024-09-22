import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { budgets } from "test/mock/ynabApiData";
import { afterEach, beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { PopupNav } from "~components";
import { useStorageContext } from "~lib/context";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken),
    budgets: JSON.stringify([budgets[0].id, budgets[1].id])
  });
  window.localStorage.setItem("selectedBudget", `"${budgets[0].id}"`);
});

afterEach(() => window.localStorage.removeItem("selectedBudget"));

test("Correct budget is selected", async () => {
  const wrapper = createTestAppWrapper();
  render(<PopupNav />, { wrapper });
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveDisplayValue(budgets[0].name)
  );
});

test("Can be navigated with keyboard", async () => {
  const wrapper = createTestAppWrapper();
  render(<PopupNav />, { wrapper });
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveDisplayValue(budgets[0].name)
  );

  const user = userEvent.setup();
  await user.keyboard("{Tab}");
  expect(screen.getByRole("combobox")).toHaveFocus();
  await user.keyboard("{Tab}");
  expect(screen.getByLabelText("Open", { exact: false })).toHaveFocus();
  await user.keyboard("{Tab}");
  expect(screen.getByLabelText("Menu")).toHaveFocus();

  expect(screen.queryByRole("menu")).toBeNull();
  await user.keyboard("{Enter}");
  expect(screen.queryByRole("menu"), "can open menu").toBeTruthy();
  expect(
    screen.getByRole("menuitem", { name: "Edit pinned items" }),
    "first item is auto-focused"
  ).toHaveFocus();
  await user.keyboard("{ArrowDown}");
  expect(
    screen.getByRole("menuitem", { name: "Open in new window" }),
    "can navigate menu"
  ).toHaveFocus();
  await user.keyboard("{Esc}");
  expect(screen.queryByRole("menu"), "can close menu").toBeNull();
});

test("Selecting a menu item closes the menu", async () => {
  const wrapper = createTestAppWrapper();
  render(<PopupNav />, { wrapper });
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveDisplayValue(budgets[0].name)
  );

  const user = userEvent.setup();
  await user.keyboard("{Tab}{Tab}{Tab}{Enter}");
  expect(screen.queryByRole("menu")).toBeTruthy();
  await user.keyboard("{Enter}");
  expect(screen.queryByRole("menu"), "keyboard closes menu").toBeNull();

  await user.click(screen.getByLabelText("Menu"));
  expect(screen.queryByRole("menu")).toBeTruthy();
  await user.click(screen.getByText("Edit", { exact: false }));
  expect(screen.queryByRole("menu"), "mouse closes menu").toBeNull();
});

test("Can activate edit mode", async () => {
  const Wrapper = createTestAppWrapper();
  const { result } = renderHook(useStorageContext, {
    wrapper: ({ children }) => (
      <Wrapper>
        <PopupNav />
        {children}
      </Wrapper>
    )
  });
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toHaveDisplayValue(budgets[0].name)
  );

  const user = userEvent.setup();
  expect(result.current.popupState.editMode).toBeFalsy();
  await user.click(screen.getByLabelText("Menu"));
  await user.click(screen.getByText("Edit", { exact: false }));
  expect(result.current.popupState.editMode).toEqual(true);
});
