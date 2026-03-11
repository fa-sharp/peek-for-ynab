import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { browser } from "#imports";
import { mockServer } from "~test/mock/msw";

// Test lifecycle
beforeAll(() => mockServer.listen({ onUnhandledRequest: "error" }));
afterEach(async () => {
  mockServer.resetHandlers();
  fakeBrowser.reset();
  await browser.storage.local.clear();
  cleanup();
});
afterAll(() => {
  mockServer.close();
  mockServer.dispose();
});

// Browser extension API mocks
browser.action.setTitle = vi.fn();
browser.action.setBadgeText = vi.fn();
browser.action.setBadgeTextColor = vi.fn();
browser.action.setBadgeBackgroundColor = vi.fn();
browser.notifications.create = vi.fn();
