import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { budgets } from "test/mock/ynabApiData";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { PopupNav } from "~components";
import { useStorageContext } from "~lib/context";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken),
    budgets: JSON.stringify([budgets[0].id, budgets[1].id])
  });
});

test("Can open budgets and settings", { todo: true }, async () => {
  const wrapper = createTestAppWrapper();
  const user = userEvent.setup();
  const { result } = renderHook(useStorageContext, { wrapper });
  render(<PopupNav />, { wrapper });
});
