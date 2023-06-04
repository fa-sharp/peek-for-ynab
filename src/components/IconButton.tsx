import type { MouseEventHandler, ReactElement } from "react";

/** An icon that functions as a button. Uses HTML <button> element with `aria-label` for accessibility */
export default function IconButton({
  icon,
  onClick,
  label,
  bordered,
  spin,
  disabled,
  noAction
}: {
  label: string;
  onClick?: MouseEventHandler;
  icon: ReactElement;
  bordered?: boolean;
  spin?: boolean;
  disabled?: boolean;
  noAction?: boolean;
}) {
  let className = "icon-button";
  if (bordered) className += " bordered";
  if (spin) className += " spin";
  if (noAction) className += " noaction";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={className}
      onClick={onClick}
      disabled={disabled}>
      {icon}
    </button>
  );
}
