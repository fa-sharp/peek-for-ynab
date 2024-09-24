import { clsx } from "clsx";
import type { MouseEventHandler, ReactElement } from "react";

/** An icon that functions as a button. Uses HTML <button> element with `aria-label` for accessibility */
export default function IconButton({
  icon,
  onClick,
  label,
  accent,
  rounded,
  spin,
  disabled
}: {
  label: string;
  onClick?: MouseEventHandler;
  icon: ReactElement;
  accent?: boolean;
  rounded?: boolean;
  spin?: boolean;
  disabled?: boolean;
}) {
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
      onClick={onClick}
      disabled={disabled}>
      {icon}
    </button>
  );
}
