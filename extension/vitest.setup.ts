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
  cleanup();
});
afterAll(() => {
  mockServer.close();
});

// FIXME ignore act warning for now: https://github.com/testing-library/react-testing-library/pull/1214
const consoleError = console.error;
console.error = vi.fn().mockImplementation((...args) => {
  const ignoredMessage =
    "The current testing environment is not configured to support act(...)";
  if (args[0] !== ignoredMessage) {
    consoleError(...args);
  }
});

// Browser extension API mocks
browser.action.setTitle = vi.fn();
browser.action.setBadgeText = vi.fn();
browser.action.setBadgeTextColor = vi.fn();
browser.action.setBadgeBackgroundColor = vi.fn();
browser.notifications.create = vi.fn();
