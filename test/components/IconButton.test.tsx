import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { expect, test } from "vitest";
import "vitest-dom/extend-expect";

import { IconButton } from "~components";
import { PinItemIcon } from "~components/icons/ActionIcons";

test("Displays button with aria-label and title", async () => {
  render(<IconButton icon={<PinItemIcon />} label="Pin item" />);

  expect(screen.getByRole("button")).toHaveAttribute("title", "Pin item");
  expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Pin item");
});

test("Can focus on button with keyboard", async () => {
  const user = userEvent.setup();
  render(<IconButton icon={<PinItemIcon />} label="Pin item" />);

  await user.keyboard("{Tab}");
  expect(screen.getByRole("button")).toHaveFocus();
});

test("Changes class names correctly", async () => {
  const { rerender } = render(
    <IconButton icon={<PinItemIcon />} label="Pin item" accent spin noAction />
  );
  expect(screen.getByRole("button")).toHaveClass("accent spin noaction");

  rerender(<IconButton icon={<PinItemIcon />} label="Pin item" rounded accent />);
  expect(screen.getByRole("button")).toHaveClass("accent rounded");
});
