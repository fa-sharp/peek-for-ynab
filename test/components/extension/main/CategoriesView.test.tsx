import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { CategoriesView } from "~components";
import { useYNABContext } from "~lib/context";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("Can expand and collapse all category groups", async () => {
  const user = userEvent.setup();
  const wrapper = createTestAppWrapper();

  render(<CategoriesView />, { wrapper });
  await waitFor(() => screen.getByText("Categories"));

  expect(screen.queryByText("Bills")).toBeNull();
  await user.click(screen.getByLabelText("Expand"));
  expect(screen.queryByText("Bills")).toBeTruthy();
  expect(screen.queryByText("Bills")).toHaveAttribute("role", "heading");
  await user.click(screen.getByLabelText("Collapse"));
  expect(screen.queryByText("Bills")).toBeNull();
});

test("Can expand and collapse a category group", async () => {
  const user = userEvent.setup();
  const wrapper = createTestAppWrapper();

  render(<CategoriesView />, { wrapper });
  await waitFor(() => screen.getByText("Categories"));

  await user.click(screen.getByLabelText("Expand"));

  expect(screen.queryByRole("list")).toBeNull();
  expect(screen.queryByText("Rent/Mortgage")).toBeNull();

  const expandBillsButton = screen.queryByText("Bills")?.previousElementSibling;
  expect(expandBillsButton).toBeTruthy();
  await user.click(expandBillsButton!);
  expect(screen.queryByRole("list")).toBeTruthy();
  expect(screen.getByText("Rent/Mortgage")).toBeTruthy();
});
