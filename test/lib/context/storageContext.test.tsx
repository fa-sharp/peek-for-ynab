import { renderHook, waitFor } from "@testing-library/react";
import { randomUUID } from "crypto";
import { expect, test } from "vitest";

import { DEFAULT_SETTINGS } from "~lib/constants";
import { useStorageContext } from "~lib/context";
import { StorageProvider } from "~lib/context/storageContext";
import type { TokenData } from "~lib/types";

test("Can render storage hook successfully, with default settings", async () => {
  const { result } = renderHook(useStorageContext, {
    wrapper: StorageProvider
  });
  await waitFor(() => expect(result.current.tokenData).toBeNull());

  expect(result.current.popupState?.view).toBe("main");
  expect(result.current.settings).toMatchObject(DEFAULT_SETTINGS);
});

test("Can change a setting, and persist to storage", async () => {
  const { result } = renderHook(useStorageContext, {
    wrapper: StorageProvider
  });
  await waitFor(() => expect(result.current.settings).toBeTruthy());

  result.current.changeSetting("emojiMode", true);
  await waitFor(() =>
    expect(result.current.settings?.emojiMode, "emojiMode rendered").toBe(true)
  );

  const { settings } = await chrome.storage.local.get("settings");
  expect(JSON.parse(settings), "emojiMode persisted").toMatchObject({ emojiMode: true });
});

test("Reads persisted settings on initialization", async () => {
  await chrome.storage.local.set({
    settings: JSON.stringify({
      ...DEFAULT_SETTINGS,
      animations: false
    })
  });
  const { result } = renderHook(useStorageContext, {
    wrapper: StorageProvider
  });
  await waitFor(() => expect(result.current.settings).toBeTruthy());

  expect(result.current.settings?.animations).toBe(false);
});

test("Can save token data", async () => {
  const { result } = renderHook(useStorageContext, {
    wrapper: StorageProvider
  });
  await waitFor(() => expect(result.current.tokenData).toBeNull());

  const token: TokenData = {
    accessToken: "access",
    refreshToken: "refresh",
    expires: Date.now()
  };
  await result.current.setTokenData(token);

  const { tokenData } = await chrome.storage.local.get("tokenData");
  expect(JSON.parse(tokenData), "tokenData persisted").toMatchObject(token);
});

test("Can add and persist saved category", async () => {
  const { result } = renderHook(useStorageContext, {
    wrapper: StorageProvider
  });
  await waitFor(() => expect(result.current.savedCategories).toBeTruthy());

  const budgetId = randomUUID();
  const categoryId = randomUUID();
  result.current.setPopupState({ budgetId });
  await waitFor(() => expect(result.current.popupState?.budgetId).toBe(budgetId));

  result.current.saveCategory(categoryId);
  await waitFor(() =>
    expect(result.current.savedCategories).toMatchObject({
      [budgetId]: [categoryId]
    })
  );

  const { cats } = await chrome.storage.local.get("cats");
  expect(JSON.parse(cats), "saved categories persisted").toMatchObject({
    [budgetId]: [categoryId]
  });
});

test("Can remove saved category", async () => {
  const { result } = renderHook(useStorageContext, {
    wrapper: StorageProvider
  });
  await waitFor(() => expect(result.current.savedCategories).toBeTruthy());

  const budgetId = randomUUID();
  result.current.setPopupState({ budgetId });
  await waitFor(() => expect(result.current.popupState?.budgetId).toBe(budgetId));

  const category1 = randomUUID();
  const category2 = randomUUID();
  result.current.saveCategoriesForBudget(budgetId, [category1, category2]);
  await waitFor(() =>
    expect(result.current.savedCategories).toMatchObject({
      [budgetId]: [category1, category2]
    })
  );

  result.current.removeCategory(category1);
  await waitFor(() =>
    expect(result.current.savedCategories).toStrictEqual({
      [budgetId]: [category2]
    })
  );
  const { cats } = await chrome.storage.local.get("cats");
  expect(JSON.parse(cats), "saved categories persisted").toStrictEqual({
    [budgetId]: [category2]
  });
});

test("Can remove all local data", async () => {
  await chrome.storage.local.set({
    cats: JSON.stringify({
      [randomUUID()]: [randomUUID()]
    }),
    accounts: JSON.stringify({
      [randomUUID()]: [randomUUID()]
    })
  });
  window.localStorage.setItem("selectedBudget", randomUUID());

  const { result } = renderHook(useStorageContext, {
    wrapper: StorageProvider
  });
  await waitFor(() => expect(result.current.settings).toBeTruthy());

  await result.current.removeAllData();

  waitFor(() => expect(result.current.popupState?.budgetId).toBeFalsy());
  waitFor(() => expect(result.current.popupState?.txAddState).toBeFalsy());
  waitFor(() => expect(result.current.savedCategories).toStrictEqual({}));
  waitFor(() => expect(result.current.savedAccounts).toStrictEqual({}));

  const { cats } = await chrome.storage.local.get("cats");
  const { accounts } = await chrome.storage.local.get("accounts");
  expect(cats).toBeUndefined();
  expect(accounts).toBeUndefined();
});
