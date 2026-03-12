import { randomUUID } from "crypto";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";

import { browser } from "#imports";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "~lib/constants";
import { useStorageContext } from "~lib/context";
import { appSettingsStorage, tokenDataStorage } from "~lib/state";
import { createTestAppWrapper } from "~test/mock/wrapper";

test("Can render storage hook successfully, with default settings", async () => {
  const { result } = await act(() =>
    renderHook(useStorageContext, {
      wrapper: createTestAppWrapper(),
    })
  );

  expect(result.current.popupState.view).toBe("main");
  expect(result.current.settings).toMatchObject(DEFAULT_SETTINGS);
});

test("Can change a setting, and persist to storage", async () => {
  const { result } = await act(() =>
    renderHook(useStorageContext, {
      wrapper: createTestAppWrapper(),
    })
  );
  await waitFor(() => expect(result.current.settings).toBeTruthy());

  result.current.changeSetting("theme", "dark");
  await waitFor(() =>
    expect(result.current.settings?.theme, "theme rendered").toBe("dark")
  );

  const { settings } = await browser.storage.local.get("settings");
  expect(settings, "theme persisted").toMatchObject({
    theme: "dark",
  });
});

test("Reads persisted settings on initialization", async () => {
  await appSettingsStorage("local").setValue({
    ...DEFAULT_SETTINGS,
    animations: false,
  });

  const { result } = await act(() =>
    renderHook(useStorageContext, {
      wrapper: createTestAppWrapper(),
    })
  );
  expect(result.current.settings.animations).toBe(false);
});

test("Can add and persist saved category", async () => {
  const { result } = await act(() =>
    renderHook(useStorageContext, {
      wrapper: createTestAppWrapper(),
    })
  );
  await waitFor(() => expect(result.current.pinnedItems).toBeTruthy());

  const budgetId = randomUUID();
  const categoryId = randomUUID();
  result.current.setPopupState({ budgetId, view: "main" });
  await waitFor(() => expect(result.current.popupState.budgetId).toBe(budgetId));

  result.current.toggleCategory(categoryId);
  await waitFor(() =>
    expect(result.current.pinnedItems).toMatchObject({
      categories: [categoryId],
    })
  );

  const stored = await browser.storage.local.get(`budget-${budgetId}:pinned`);
  expect(stored[`budget-${budgetId}:pinned`]).toMatchObject({ categories: [categoryId] });
});

test("Can remove saved category", async () => {
  const { result } = await act(() =>
    renderHook(useStorageContext, {
      wrapper: createTestAppWrapper(),
    })
  );
  await waitFor(() => expect(result.current.pinnedItems).toBeTruthy());

  const budgetId = randomUUID();
  result.current.setPopupState({ budgetId, view: "main" });
  await waitFor(() => expect(result.current.popupState?.budgetId).toBe(budgetId));

  const category1 = randomUUID();
  const category2 = randomUUID();
  result.current.setCategories([category1, category2]);
  await waitFor(() =>
    expect(result.current.pinnedItems).toMatchObject({
      categories: [category1, category2],
    })
  );

  result.current.toggleCategory(category1);
  await waitFor(() =>
    expect(result.current.pinnedItems).toMatchObject({
      categories: [category2],
    })
  );
  const stored = await browser.storage.local.get(`budget-${budgetId}:pinned`);
  expect(stored[`budget-${budgetId}:pinned`], "saved categories persisted").toMatchObject(
    {
      categories: [category2],
    }
  );
});

// TODO: remove after auth migration
test("Automatically clears old token", async () => {
  await tokenDataStorage.setValue({
    accessToken: "access",
    refreshToken: "refresh",
    expires: Date.now() + 60 * 60 * 1000,
  });

  await act(() =>
    renderHook(useStorageContext, {
      wrapper: createTestAppWrapper(),
    })
  );

  expect(await browser.storage.local.get(STORAGE_KEYS.OldToken)).toMatchObject({
    [STORAGE_KEYS.OldToken]: undefined,
  });
});
