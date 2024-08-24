import { clsx } from "clsx";
import type { ReactElement } from "react";

/** Uses HTML `<span>` element with `aria-label` for accessibility */
export default function IconSpan({
  icon,
  label,
  spin
}: {
  label: string;
  icon: ReactElement;
  spin?: boolean;
}) {
  return (
    <span aria-label={label} title={label} className={clsx("flex-row", { spin })}>
      {icon}
    </span>
  );
}
