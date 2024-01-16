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
  disabled,
  noAction
}: {
  label: string;
  onClick?: MouseEventHandler;
  icon: ReactElement;
  accent?: boolean;
  rounded?: boolean;
  spin?: boolean;
  disabled?: boolean;
  noAction?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx("icon-button", {
        rounded,
        spin,
        accent,
        noaction: noAction
      })}
      onClick={onClick}
      disabled={disabled}>
      {icon}
    </button>
  );
}
