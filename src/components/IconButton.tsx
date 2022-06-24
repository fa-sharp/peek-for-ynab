import type { MouseEventHandler, ReactElement } from "react";

/** An icon that functions as a button. Uses HTML <button> element with `aria-label` for accessibility */
export default function IconButton({
  icon,
  onClick,
  label
}: {
  label: string;
  onClick: MouseEventHandler;
  icon: ReactElement;
}) {
  return (
    <button aria-label={label} title={label} className="icon-button" onClick={onClick}>
      {icon}
    </button>
  );
}
