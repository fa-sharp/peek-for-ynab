import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { category_groups } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";
import type { Category } from "ynab";

import { CategorySelect } from "~components";
import { useYNABContext } from "~lib/context";

const electricCategory = category_groups
  .find((cg) => cg.name === "Bills")!
  .categories.find((c) => c.name === "Electric")!;
const shoppingCategory = category_groups
  .find((cg) => cg.name === "Non-Monthly")!
  .categories.find((c) => c.name.includes("Shopping"))!;

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("Mouse behavior works as expected", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(useYNABContext, { wrapper });
  await waitFor(() => expect(result.current.categoriesData).toBeTruthy());

  const user = userEvent.setup();
  let selectedCategory: Category | null = null;
  render(
    <CategorySelect
      selectCategory={(c) => (selectedCategory = c)}
      categories={result.current.categoriesData}
    />,
    { wrapper }
  );

  expect(screen.getByRole("listbox"), "No list appears initially").toBeEmptyDOMElement();
  await user.click(screen.getByRole("combobox"));
  expect(
    screen.getAllByRole("listitem").length,
    "Category list appears on click"
  ).toBeGreaterThan(3);

  const electricCategoryListItem = screen.getByRole("listbox").children[3];
  expect(electricCategoryListItem).toHaveTextContent("Electric");
  await user.hover(electricCategoryListItem);
  expect(electricCategoryListItem, "Highlights category on hover").toHaveClass(
    "highlighted"
  );
  await user.click(electricCategoryListItem);
  expect(selectedCategory, "Selects the proper category on click").toMatchObject(
    electricCategory
  );
});

test("Keyboard behavior works as expected", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(useYNABContext, { wrapper });
  await waitFor(() => expect(result.current.categoriesData).toBeTruthy());

  const user = userEvent.setup();
  let selectedCategory: Category | null = null;
  render(
    <CategorySelect
      selectCategory={(c) => (selectedCategory = c)}
      categories={result.current.categoriesData}
    />,
    { wrapper }
  );

  expect(screen.getByRole("listbox"), "No list appears initially").toBeEmptyDOMElement();

  await user.keyboard("{Tab}");
  expect(screen.getByRole("combobox"), "Tab key focuses on combobox").toHaveFocus();
  expect(screen.getByRole("listbox"), "No list after tab key").toBeEmptyDOMElement();

  await user.keyboard("{ArrowDown}");
  expect(
    screen.getAllByRole("listitem").length,
    "Category list appears on down arrow"
  ).toBeGreaterThan(3);
  const readyToAssign = screen.getByRole("listbox").children[0];
  expect(readyToAssign, "First category highlighted on down arrow").toHaveClass(
    "highlighted"
  );
  await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
  expect(selectedCategory, "Enter key selects the proper category").toMatchObject(
    electricCategory
  );
});

test("Filtering works as expected", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(useYNABContext, { wrapper });
  await waitFor(() => expect(result.current.categoriesData).toBeTruthy());

  const user = userEvent.setup();
  let selectedCategory: Category | null = null;
  render(
    <CategorySelect
      selectCategory={(c) => (selectedCategory = c)}
      categories={result.current.categoriesData}
    />,
    { wrapper }
  );

  await user.keyboard("{Tab}shopping");
  expect(screen.getByRole("listbox").children[0]).toHaveTextContent("Non-Monthly");
  expect(screen.getByRole("listbox").children[1]).toHaveTextContent("Shopping");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(selectedCategory).toMatchObject(shoppingCategory);
});

test("Ready to Assign appears as first category", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(useYNABContext, { wrapper });
  await waitFor(() => expect(result.current.categoriesData).toBeTruthy());

  const user = userEvent.setup();
  render(
    <CategorySelect
      selectCategory={() => {}}
      categories={result.current.categoriesData}
    />,
    { wrapper }
  );

  await user.click(screen.getByLabelText("open", { exact: false }));
  const categoryList = screen.getByRole("listbox").childNodes;
  expect(categoryList[0]).toHaveTextContent("Inflow: Ready to Assign");
});

test("Credit Card Payment categories don't appear", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(useYNABContext, { wrapper });
  await waitFor(() => expect(result.current.categoriesData).toBeTruthy());

  const user = userEvent.setup();
  render(
    <CategorySelect
      selectCategory={() => {}}
      categories={result.current.categoriesData}
    />,
    { wrapper }
  );

  await user.click(screen.getByLabelText("open", { exact: false }));
  expect(screen.queryByText("Credit Card Payments")).toBeNull();
});

test("Clear button works as expected", async () => {
  const wrapper = createTestAppWrapper();

  const { result } = renderHook(useYNABContext, { wrapper });
  await waitFor(() => expect(result.current.categoriesData).toBeTruthy());

  const user = userEvent.setup();
  let selectedCategory: Category | null = null;
  render(
    <CategorySelect
      selectCategory={(c) => (selectedCategory = c)}
      categories={result.current.categoriesData}
    />,
    { wrapper }
  );

  expect(selectedCategory).toBeNull();
  await user.keyboard("{Tab}{ArrowDown}{Enter}");
  expect(selectedCategory).toMatchObject({ name: "Inflow: Ready to Assign" });

  await user.click(screen.getByLabelText("Clear category"));
  expect(selectedCategory).toBeNull();
});
