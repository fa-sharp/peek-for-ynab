import { clsx } from "clsx";
import type { ComponentPropsWithoutRef, MouseEventHandler, ReactElement } from "react";

/** An icon that functions as a button. Uses HTML <button> element with `aria-label` for accessibility */
export default function IconButton({
  icon,
  label,
  accent,
  rounded,
  spin,
  ...props
}: {
  label?: string;
  onClick?: MouseEventHandler;
  icon: ReactElement;
  accent?: boolean;
  rounded?: boolean;
  spin?: boolean;
} & ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx("icon-button", {
        rounded,
        spin,
        accent
      })}
      {...props}>
      {icon}
    </button>
  );
}
