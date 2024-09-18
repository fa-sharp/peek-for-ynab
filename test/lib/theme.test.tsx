import { renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import "vitest-dom/extend-expect";

import { useSetColorTheme } from "~lib/hooks";

beforeEach(() => {
  window.localStorage.clear();
});

test("'useSetColorTheme' correctly sets light and dark theme based on user setting", async () => {
  window.localStorage.setItem("theme", '"dark"');

  const { rerender } = renderHook(useSetColorTheme);
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  window.localStorage.setItem("theme", '"light"');
  rerender();
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});

test("'useSetColorTheme' correctly sets automatic theme from media query", async () => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: true,
    media: "",
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));

  const { rerender } = renderHook(useSetColorTheme);
  expect(document.documentElement.classList.contains("dark")).toBe(true);

  window.localStorage.setItem("theme", '"light"');
  rerender();
  expect(document.documentElement.classList.contains("dark")).toBe(false);
});
