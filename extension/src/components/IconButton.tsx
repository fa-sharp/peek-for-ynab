import { clsx } from "clsx";
import type { ComponentPropsWithoutRef, ReactElement } from "react";

/** An icon that functions as a button. Uses HTML <button> element with `aria-label` for accessibility */
export default function IconButton({
  icon,
  label,
  accent,
  gray,
  rounded,
  spin,
  ...props
}: {
  label?: string;
  icon: ReactElement;
  accent?: boolean;
  gray?: boolean;
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
        accent,
        gray
      })}
      {...props}>
      {icon}
    </button>
  );
}
