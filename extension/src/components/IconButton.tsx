import { clsx } from "clsx";
import type { ComponentPropsWithRef, ReactElement } from "react";
import React from "react";

/** An icon that functions as a button. Uses HTML <button> element with `aria-label` for accessibility */
function IconButton({
  icon,
  label,
  accent,
  gray,
  rounded,
  spin,
  className,
  ...props
}: {
  label?: string;
  icon: ReactElement;
  accent?: boolean;
  gray?: boolean;
  rounded?: boolean;
  spin?: boolean;
} & ComponentPropsWithRef<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        "icon-button",
        {
          rounded,
          spin,
          accent,
          gray,
        },
        className
      )}
      {...props}>
      {icon}
    </button>
  );
}

export default React.memo(IconButton);
