import type { MouseEventHandler, ReactElement } from "react";

/** An icon that functions as a button. Uses native <button> element with aria-label to ensure accessibility */
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
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        lineHeight: 0,
        cursor: "pointer"
      }}>
      {icon}
    </button>
  );
}