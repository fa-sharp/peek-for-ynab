import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { CurrencyView } from "~components";

test("Displays positive balance correctly", () => {
  render(<CurrencyView milliUnits={10_000} colorsEnabled />);
  expect(screen.getByText("10", { exact: false })).toHaveClass("positive currency");
});

test("Displays negative balance correctly", () => {
  render(<CurrencyView milliUnits={-10_000} colorsEnabled />);
  expect(screen.getByText("10", { exact: false })).toHaveClass("negative currency");
});

test("Displays zero balance correctly", () => {
  render(<CurrencyView milliUnits={0} colorsEnabled />);
  expect(screen.getByText("0", { exact: false })).toHaveClass("currency");
});

test("Hides balance correctly", () => {
  render(<CurrencyView milliUnits={10_000} colorsEnabled hideBalance />);
  expect(screen.getByText("10", { exact: false })).toHaveClass("hidden");
});
