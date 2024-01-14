import { expect, test } from "vitest";

import {
  findEmoji,
  formatCurrency,
  getTodaysDateISO,
  parseLocaleNumber
} from "~lib/utils";

test("'formatCurrency' correctly formats milliunits to different currencies", () => {
  expect(
    formatCurrency(3_420_350, {
      iso_code: "USD",
      decimal_digits: 2
    }),
    "US dollars"
  ).toBe("$3,420.35");

  expect(
    formatCurrency(33_420_200, {
      iso_code: "GBP",
      decimal_digits: 2
    }),
    "GB pounds"
  ).toBe("£33,420.20");

  expect(
    formatCurrency(244_240, {
      iso_code: "EUR",
      decimal_digits: 3
    }),
    "Euros with 3 decimals"
  ).toBe("€244.240");
});

test("'getTodaysDateISO' returns date in correct format", () => {
  const today = getTodaysDateISO();
  expect(today.length).toBe(10);
  expect(/\d{4}-\d{2}-\d{2}/.test(today)).toBe(true);
});

test("'parseLocaleNumber' can parse numbers in different locales correctly", () => {
  expect(parseLocaleNumber("$420,420.42", ["en-US"]), "en-US, USD").toBe(420_420.42);
  expect(parseLocaleNumber("£420,420.42", ["en-GB"]), "en-GB, GBP").toBe(420_420.42);
  expect(parseLocaleNumber("€420.420,42", ["de-DE"]), "de-DE, EUR").toBe(420_420.42);
});

test("'findEmoji' successfully finds emojis in strings", () => {
  expect(findEmoji("🧑‍🎓 School"), "emoji at beginning").toBe("🧑‍🎓");
  expect(findEmoji("Giving ❤️‍🩹"), "emoji at end").toBe("❤️‍🩹");
  expect(findEmoji("Love 😍 the 🌎 Earth 🌲", 3), "emojis interspersed").toBe("😍🌎🌲");
});
