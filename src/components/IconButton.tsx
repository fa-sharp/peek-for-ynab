import type { MouseEventHandler, ReactElement } from "react";

/** An icon that functions as a button. Uses HTML <button> element with `aria-label` for accessibility */
export default function IconButton({
  icon,
  onClick,
  label,
  spin,
  disabled
}: {
  label: string;
  onClick: MouseEventHandler;
  icon: ReactElement;
  spin?: boolean;
  disabled?: boolean;
}) {
  let className = "icon-button";
  if (spin) className += " spin";

  return (
    <button
      aria-label={label}
      title={label}
      className={className}
      onClick={onClick}
      disabled={disabled}>
      {icon}
    </button>
  );
}
