import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { AllCategoriesView } from "~components";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("Can expand and collapse all category groups", async () => {
  const user = userEvent.setup();
  const wrapper = createTestAppWrapper();

  render(<AllCategoriesView />, { wrapper });
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

  render(<AllCategoriesView />, { wrapper });
  await waitFor(() => screen.getByText("Categories"));

  await user.click(screen.getByLabelText("Expand"));

  expect(screen.queryByRole("list")).toBeTruthy();
  expect(screen.queryByText("Rent/Mortgage")).toBeNull();

  const expandBillsButton = screen.queryByText("Bills")?.previousElementSibling;
  expect(expandBillsButton).toBeTruthy();
  await user.click(expandBillsButton!);
  expect(screen.queryAllByRole("list")).toHaveLength(2);
  expect(screen.getByText("Rent/Mortgage")).toBeTruthy();
});
