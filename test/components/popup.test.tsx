import { renderHook, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { validToken } from "test/mock/userData";
import { createTestAppWrapper } from "test/mock/wrapper";
import { beforeEach, expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { useStorageContext, useYNABContext } from "~lib/context";
import { PopupView } from "~popup";

beforeEach(async () => {
  await chrome.storage.local.set({
    tokenData: JSON.stringify(validToken)
  });
});

test("Can record credit card payment via CCP category", async () => {
  const user = userEvent.setup();
  const Wrapper = createTestAppWrapper();

  const { result } = renderHook(
    () => ({
      ynab: useYNABContext(),
      storage: useStorageContext()
    }),
    {
      wrapper: ({ children }) => (
        <Wrapper>
          <PopupView />
          {children}
        </Wrapper>
      )
    }
  );
  await waitFor(() => expect(result.current.ynab.categoriesData).toBeTruthy());

  await user.click(screen.getByText("Categories").previousElementSibling!);
  await user.click(screen.getByText("Credit Card Payments").previousElementSibling!);

  const addCCPaymentButton = screen.queryByLabelText("Add credit card payment");
  expect(addCCPaymentButton).toBeTruthy();
  await user.click(addCCPaymentButton!);

  expect(result.current.storage.popupState).toMatchObject({
    view: "txAdd"
  });
  expect(result.current.storage.txState).toMatchObject({
    accountId: "509fec7a-f582-4fc7-8fa3-a133d6aae076",
    isTransfer: true,
    amount: "130.00",
    amountType: "Inflow"
  });
});
