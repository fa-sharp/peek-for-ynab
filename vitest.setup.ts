import { cleanup } from "@testing-library/react";
import { mockServer } from "test/mock/msw";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

//@ts-expect-error hack to make some jest mocks work with vitest
globalThis.jest = vi;

beforeAll(() => {
  mockServer.listen();
  // mock needed for this extension API, used to detect if we're currently in a popup
  chrome.extension.getViews = vi.fn().mockImplementation(() => ["window"]);
});
afterEach(() => {
  mockServer.resetHandlers();
  chrome.storage.local.clear();
  cleanup();
});
afterAll(() => mockServer.close());
