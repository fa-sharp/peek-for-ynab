// @vitest-environment node
import { expect, test } from "vitest";

import { type ParsedTransferQuery, type ParsedTxQuery, parseTxInput } from "~lib/omnibox";

test("'parseTxInput' can skip fields", () => {
  const { amount, memo, categoryQuery } =
    parseTxInput("add 34.53 for fun memo yayyy") || {};
  expect(amount).toBe("34.53");
  expect(categoryQuery?.trim()).toBe("fun");
  expect(memo?.trim()).toBe("yayyy");
});

test("'parseTxInput' can parse all transaction fields", () => {
  const { type, amount, memo, accountQuery, payeeQuery, categoryQuery } = parseTxInput(
    "add 142.93 at Marshalls for fun on amex gold memo gift for friends"
  ) as ParsedTxQuery;

  expect(type).toBe("tx");
  expect(amount).toBe("142.93");
  expect(payeeQuery?.trim()).toBe("Marshalls");
  expect(accountQuery?.trim()).toBe("amex gold");
  expect(categoryQuery?.trim()).toBe("fun");
  expect(memo?.trim()).toBe("gift for friends");
});

test("'parseTxInput' can parse all transfer fields", () => {
  const { type, amount, memo, fromAccountQuery, toAccountQuery, categoryQuery } =
    parseTxInput(
      "transfer 242.19 from usaa checking to ally savings memo save that monayyy"
    ) as ParsedTransferQuery;

  expect(type).toBe("transfer");
  expect(amount).toBe("242.19");
  expect(fromAccountQuery?.trim()).toBe("usaa checking");
  expect(toAccountQuery?.trim()).toBe("ally savings");
  expect(categoryQuery).toBeFalsy();
  expect(memo?.trim()).toBe("save that monayyy");
});

test("'parseTxInput' detects the amount type correctly", () => {
  const { amountType } = parseTxInput("add -50.42") as ParsedTxQuery;
  expect(amountType).toBe("Outflow");

  const { amountType: amountType2 } = parseTxInput("add +100.23") as ParsedTxQuery;
  expect(amountType2).toBe("Inflow");

  const { amountType: amountType3 } = parseTxInput("add on account") as ParsedTxQuery;
  expect(amountType3).toBe("Outflow");
});
