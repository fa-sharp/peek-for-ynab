import { randomUUID } from "node:crypto";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { fakeBrowser } from "wxt/testing";

import { browser } from "#imports";
import { mockServer } from "~test/mock/msw";

// Test lifecycle
beforeAll(() => mockServer.listen({ onUnhandledRequest: "error" }));
beforeEach(() => {
  // Mock messages to background thread
  (fakeBrowser as typeof browser).runtime.onMessage.addListener((msg) => {
    switch (msg.type) {
      // Mock fetching & setting of access token
      case "fetchToken": {
        const accessToken = randomUUID();
        browser.storage.session.set({
          accessToken: { lastChecked: Date.now(), value: accessToken },
        });
        return {
          res: { success: true, accessToken },
        };
      }
      default: {
        throw new Error(`Unrecognized message type ${msg.type}`);
      }
    }
  });
});
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
