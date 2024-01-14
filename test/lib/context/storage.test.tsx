import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { DEFAULT_SETTINGS } from "~lib/constants";
import { useStorageContext } from "~lib/context";
import { StorageProvider } from "~lib/context/storageContext";

afterEach(() => {
  chrome.storage.local.clear();
  cleanup();
});

test("Can render storage hook successfully, with default settings", async () => {
  const { result } = renderHook(useStorageContext, {
    wrapper: StorageProvider
  });
  await waitFor(() => expect(result.current.tokenData).toBe(null));

  expect(result.current.popupState.view).toBe("main");
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
